// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//import "forge-std/console.sol";
import {ReceiverTemplate} from "../interfaces/ReceiverTemplate.sol";
import {ud60x18, UD60x18} from "@prb/math/src/UD60x18.sol";

/**
 * @title PredictionMarket
 * @dev A contract for prediction markets
 */
contract PredictionMarket {
    using {ud60x18} for uint256;
    // ===========================
    // ======== EVENTS ===========
    // ===========================
    event MarketCreated(uint256 indexed id, string question, uint256 endTime);
    event PriceUpdated(
        uint256 indexed id,
        address indexed user,
        bool outcome,
        uint256 amount,
        uint256 yesPrice,
        uint256 noPrice,
        uint256 timeStamp
    );
    // event Sold(
    //     uint256 indexed id,
    //     address indexed user,
    //     bool outcome,
    //     uint256 amount,
    //     uint256 payout
    // );

    event Resolved(uint256 id, bool outcome);
    event Claimed(uint256 id, address user, uint256 payout);
    /// @notice Emitted when a settlement response is received and processed.
    /// @param marketId The ID of the settled market.
    /// @param status The new status of the market after settlement.
    /// @param outcome The resolved outcome of the market.
    event SettlementResponse(
        uint256 indexed marketId,
        Status indexed status,
        Outcome outcome
    );
    /// @notice Emitted when a settlement is requested for a market.
    /// @param marketId The ID of the market to settle.
    /// @param question The market's question string.
    event SettlementRequested(uint256 indexed marketId, string question);
    // ===========================
    // ======== ENUMS ============
    // ===========================

    /// @notice Possible outcomes for a market. Also serves as a user's chosen prediction.
    /// @dev `None` indicates no outcome yet or no prediction made, `Inconclusive`
    // is used when AI response/confidence is insufficient. Users may only pass No or Yes.
    enum Outcome {
        None,
        No,
        Yes,
        Inconclusive
    }

    enum Channel {
        None,
        Manual,
        Gemini
    }
    enum Status {
        Open,
        NeedsManual,
        SettlementRequested,
        Settled
    }

    enum MarketCategory {
        Crypto,
        Sports,
        Politics,
        Weather,
        Tech,
        Entertainment,
        Economics,
        Science
    }

    // ===========================
    // ======== ERRORS ===========
    // ===========================

    error MarketNotClosed(uint256 nowTs, uint256 closeTs);
    error StatusNotOpen(Status current);
    error MarketAlreadySettled(uint256 settleTs);
    error InvalidOutcome();
    error InsufficientPayment(uint256 amt);
    error SlippageExceeded();
    error TransferFailed();
    error MarketNotOpen();
    error ManualSettlementNotAllowed(Status current);
    error AlreadyPredicted();
    error AmountZero();
    error MarketNotSettled(Status current);
    error InvalidMarket(uint256 marketId);

    error NotSettledYet(Status current);
    error InsufficientShares();
    error AlreadyClaimed();
    error IncorrectPrediction();
    error SettlementNotRequested(Status current);
    error NoWinners();

    // ===========================
    // ======== STRUCTS ==========
    // ===========================

    /// @notice Represents a single prediction market instance.
    struct Market {
        string question; // Market question (e.g. "The New York Yankees will win the 2009 world series.")
        uint256 marketOpen; // Timestamp when the market opened
        uint256 marketClose; // Timestamp when the market closes for predictions
        MarketCategory category;
        Outcome outcome;
        uint256 id;
        Status status; // Final outcome of the market
        uint256 settledAt; // Timestamp when settlement occurred
        uint16 confidenceBps; // Confidence level from Gemini (in basis points: 0–10000)
        uint256 yesShares; // Amount of yes shares bought or sold
        uint256 noShares; // Amount of no shares bought or sold
        string criteria;
        uint256 liquidity; // total liqudity available for market
        Channel resolutionChannel;
        uint256 totalParticipants; // Tracks unique users with an active position
    }

    struct Prediction {
        uint256 yesAmount;
        uint256 noAmount;
        Outcome lastSide;
        uint256 lastUpdated;
        bool claimed;
    }

    // ===========================
    // ======= STATE VARS ========
    // ===========================

    /// @notice Counter tracking the next market ID to assign.
    uint256 public marketCount;

    /// @notice Mapping from market ID to its Market data.
    mapping(uint256 => Market) public markets;
    mapping(address => uint256[]) private _userActiveMarkets;
    mapping(address => mapping(uint256 => uint256))
        private _marketIndexInUserArray;

    mapping(uint256 => mapping(address => Prediction)) predictions;
    /// @notice ERC-20 token used for staking and payouts.
    /// @dev Set at deployment and immutable thereafter.
    // IERC20 public immutable paymentToken;

    constructor() {}
    // --- Internal Helpers ---

    // ===========================
    // ======== AMM MATH =========
    // ===========================

    /**
     * @notice Calculates the LMSR cost: C = b * ln(e^(y/b) + e^(n/b))
     */

    function _getCost(
        uint256 y,
        uint256 n,
        uint256 b
    ) internal pure returns (uint256) {
        if (b == 0) return 0;
        UD60x18 bF = ud60x18(b);
        // e^(y/b) + e^(n/b)
        UD60x18 sumExp = (ud60x18(y).div(bF)).exp().add(
            (ud60x18(n).div(bF)).exp()
        );
        // b * ln(sumExp)
        return bF.mul(sumExp.ln()).unwrap();
    }

    function _addToActiveMarkets(address user, uint256 id) internal {
        _marketIndexInUserArray[user][id] = _userActiveMarkets[user].length;
        _userActiveMarkets[user].push(id);
    }

    function _removeFromActiveMarkets(address user, uint256 id) internal {
        uint256[] storage active = _userActiveMarkets[user];
        uint256 indexToRemove = _marketIndexInUserArray[user][id];
        uint256 lastIndex = active.length - 1;

        if (indexToRemove != lastIndex) {
            uint256 lastMarketId = active[lastIndex];
            active[indexToRemove] = lastMarketId;
            _marketIndexInUserArray[user][lastMarketId] = indexToRemove;
        }
        active.pop();
        delete _marketIndexInUserArray[user][id];
    }

    /**
     * @notice Calculates marginal prices (0 to 1) in 18-decimal precision.
     */
    function getPrices(
        uint256 id
    ) public view returns (uint256 yesPrice, uint256 noPrice) {
        Market storage m = markets[id];
        if (m.liquidity == 0) return (0.5e18, 0.5e18);

        UD60x18 bF = ud60x18(m.liquidity);
        UD60x18 eY = (ud60x18(m.yesShares).div(bF)).exp();
        UD60x18 eN = (ud60x18(m.noShares).div(bF)).exp();
        UD60x18 total = eY.add(eN);

        yesPrice = eY.div(total).unwrap();
        noPrice = eN.div(total).unwrap();
    }

    // ===========================
    // ======== CORE LOGIC =======
    // ===========================

    function createMarket(
        string calldata _question,
        uint256 _duration,
        string calldata _criteria,
        MarketCategory _category
    ) external payable returns (uint256) {
        if (msg.value == 0) revert AmountZero();
        marketCount++;
        Market storage m = markets[marketCount];

        m.question = _question;
        m.category = _category;
        m.marketOpen = block.timestamp;
        m.marketClose = _duration;
        m.id = marketCount;
        m.liquidity = msg.value;
        m.criteria = _criteria;

        emit MarketCreated(marketCount, _question, _duration);

        return marketCount;
    }

    /// @notice View details of a market.
    /// @param marketId The ID of the market to view.
    /// @return The full Market struct for the given ID.
    function getMarketInfo(
        uint256 marketId
    ) public view returns (Market memory) {
        return markets[marketId];
    }

    /**
     * @notice Purchase shares.
     * @dev Price (msg.value) is determined off-chain by CRE and sent as value.
     */
    function buy(uint256 id, bool isYes) external payable {
        Market storage m = markets[id];

        if (msg.value == 0) revert AmountZero();
        // if (m.marketClose < block.timestamp)
        //     revert MarketNotOpen(block.timestamp, m.marketClose);
        if (block.timestamp > m.marketClose || m.status != Status.Open)
            revert MarketNotOpen();

        Prediction storage pred = predictions[id][msg.sender];

        if (pred.lastUpdated == 0) {
            _addToActiveMarkets(msg.sender, id);
            m.totalParticipants++;
        }

        if (isYes) {
            m.yesShares += msg.value;
            pred.yesAmount += msg.value;
            pred.lastSide = Outcome.Yes;
        } else {
            m.noShares += msg.value;
            pred.noAmount += msg.value;
            pred.lastSide = Outcome.No;
        }
        pred.lastUpdated = block.timestamp;

        (uint256 yP, uint256 nP) = getPrices(id);
        emit PriceUpdated(
            id,
            msg.sender,
            isYes,
            msg.value,
            yP,
            nP,
            block.timestamp
        );
    }

    /**
     * @notice Sell shares back to the pool.
     * @param minPayout The ETH expected back, calculated off-chain by CRE.
     */
    function sell(
        uint256 id,
        bool isYes,
        uint256 amount,
        uint256 minPayout
    ) external {
        Market storage m = markets[id];
        if (block.timestamp > m.marketClose || m.status != Status.Open)
            revert MarketNotOpen();
        Prediction storage pred = predictions[id][msg.sender];
        if (isYes) {
            if (pred.yesAmount < amount) revert InsufficientShares();
        } else {
            if (pred.noAmount < amount) revert InsufficientShares();
        }

        // 1. Calculate Fair Payout via LMSR Cost Gap
        uint256 currentCost = _getCost(m.yesShares, m.noShares, m.liquidity);
        uint256 nextYes = isYes ? m.yesShares - amount : m.yesShares;
        uint256 nextNo = !isYes ? m.noShares - amount : m.noShares;
        uint256 nextCost = _getCost(nextYes, nextNo, m.liquidity);

        uint256 payout = currentCost - nextCost;
        if (payout < minPayout) revert SlippageExceeded();

        if (isYes) {
            // if (pred.yesAmount < amount) revert InsufficientShares();
            pred.yesAmount -= amount; // Reduce prediction
            m.yesShares -= amount;
        } else {
            if (pred.noAmount < amount) revert InsufficientShares();
            pred.noAmount -= amount; // Reduce prediction
            m.noShares -= amount;
        }

        // If the user now has 0 shares in both YES and NO, they are no longer an active participant
        if (pred.yesAmount == 0 && pred.noAmount == 0) {
            pred.lastSide = Outcome.None;
            _removeFromActiveMarkets(msg.sender, id);
            if (m.totalParticipants > 0) m.totalParticipants--;
            pred.lastUpdated = 0; //TO TEST THIS
        } else {
            pred.lastUpdated = block.timestamp;
        }

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert TransferFailed();

        (uint256 yP, uint256 nP) = getPrices(id);
        emit PriceUpdated(
            id,
            msg.sender,
            isYes,
            amount,
            yP,
            nP,
            block.timestamp
        );
    }

    /// @notice Request (CRE) to settle a market.
    /// @dev Emits a SettlementRequested event for monitoring.
    /// @param marketId The ID of the market to settle.
    function requestSettlement(uint256 marketId) public {
        Market storage m = markets[marketId];
        if (m.status != Status.Open) revert StatusNotOpen(m.status);
        // if (m.marketClose > block.timestamp)
        //     revert MarketNotClosed(block.timestamp, m.marketClose);  ///REVIVE THIS AFTER TESTING

        m.status = Status.SettlementRequested;
        emit SettlementRequested(marketId, m.question);
    }

    /// @param marketId The ID of the market being settled.
    /// @param outcome The resolved market outcome.
    /// @param confidenceBps Gemini confidence score in basis points (0–10000).
    /// @dev Emits a SettlementResponse event for monitoring.
    function settleMarket(
        uint256 marketId,
        Outcome outcome,
        uint16 confidenceBps
    ) external {
        Market storage m = markets[marketId];

        if (m.marketClose > block.timestamp)
            revert MarketNotClosed(block.timestamp, m.marketClose);

        if (m.status == Status.Settled)
            revert MarketAlreadySettled(m.settledAt);

        if (outcome == Outcome.Inconclusive) {
            m.status = Status.NeedsManual;
        } else {
            m.status = Status.Settled;
            m.resolutionChannel = Channel.Gemini;
            m.settledAt = block.timestamp;
        }

        m.outcome = outcome;
        m.confidenceBps = confidenceBps;

        emit SettlementResponse(marketId, m.status, m.outcome);
    }

    /// @notice Used to manually settle markets that were set to NeedsManual due to inconclusive Gemini response.
    /// @param marketId The ID of the market being settled.
    /// @param outcome The resolved market outcome.
    function settleMarketManually(uint256 marketId, Outcome outcome) public {
        Market storage m = markets[marketId];
        if (m.marketClose > block.timestamp)
            revert MarketNotClosed(block.timestamp, m.marketClose);

        if (m.status == Status.Settled)
            revert MarketAlreadySettled(m.settledAt);
        if (outcome != Outcome.No && outcome != Outcome.Yes)
            revert InvalidOutcome();
        if (m.status != Status.NeedsManual)
            revert ManualSettlementNotAllowed(m.status);

        m.status = Status.Settled;
        m.settledAt = block.timestamp;
        m.resolutionChannel = Channel.Manual;
        m.outcome = outcome;
        emit SettlementResponse(marketId, m.status, m.outcome);
    }

    /// @notice Claim winnings after a market is settled.
    /// @dev Distributes the total pool proportionally among correct predictors.
    /// @param marketId The ID of the settled market.
    function claimWinnings(uint256 marketId) external {
        Market storage m = markets[marketId];
        Prediction storage pred = predictions[marketId][msg.sender];
        if (m.status != Status.Settled) revert MarketNotSettled(m.status);

        if (pred.claimed) revert AlreadyClaimed();
        if (m.outcome != pred.lastSide) revert IncorrectPrediction();

        uint256 stake = m.outcome == Outcome.Yes
            ? pred.yesAmount
            : pred.noAmount;
        uint256 totalPayout;

        // 🏆 CALCULATE WINNINGS
        // Winners get: Their Stake + (Their % of the winning pool * Total Loser Pool)
        uint256 winningPool = m.outcome == Outcome.Yes
            ? m.yesShares
            : m.noShares;
        uint256 losingPool = m.outcome == Outcome.Yes
            ? m.noShares
            : m.yesShares;

        if (winningPool == 0) {
            totalPayout = stake;
        } else {
            uint256 profit = (stake * losingPool) / winningPool;
            totalPayout = stake + profit;
        }

        pred.yesAmount = 0;
        pred.noAmount = 0;
        pred.lastSide = Outcome.None;
        _removeFromActiveMarkets(msg.sender, marketId);
        pred.claimed = true;
        (bool success, ) = payable(msg.sender).call{value: totalPayout}("");
        if (!success) revert TransferFailed();

        emit Claimed(marketId, msg.sender, totalPayout);
    }

    function getMarketCount() public view returns (uint256) {
        return marketCount;
    }

    /**
     * @notice Fetches all markets in a single call.
     * @return An array of all Market structs currently in the contract.
     */
    function getAllMarkets() external view returns (Market[] memory) {
        uint256 count = marketCount;
        Market[] memory allMarkets = new Market[](count);
        for (uint256 i = 0; i < count; i++) {
            allMarkets[i] = markets[i + 1];
        }
        return allMarkets;
    }

    function getUserActiveMarketIds(
        address user
    ) external view returns (uint[] memory) {
        return _userActiveMarkets[user];
    }

    function getPrediction(
        uint256 marketId
    ) external view returns (Prediction memory) {
        return predictions[marketId][msg.sender];
    }

    function getUserPredictions(
        uint256 marketId,
        address user
    ) external view returns (Prediction memory) {
        return predictions[marketId][user];
    }
}
