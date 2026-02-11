// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

//import "forge-std/console.sol";
import {ReceiverTemplate} from "../interfaces/ReceiverTemplate.sol";
/**
 * @title PredictionMarket
 * @dev A contract for prediction markets
 */
contract PredictionMarket is ReceiverTemplate {
    // ===========================
    // ======== EVENTS ===========
    // ===========================
    event MarketCreated(uint256 indexed id, string question, uint256 endTime);
    event Bought(
        uint256 indexed id,
        address indexed user,
        bool outcome,
        uint256 amount
    );
    event Sold(
        uint256 id,
        address user,
        bool outcome,
        uint256 amount,
        uint256 payout
    );
    event Resolved(uint256 id, bool outcome);
    event Claimed(uint256 id, address user, uint256 payout);
    /// @notice Emitted when a settlement response is received and processed.
    /// @param marketId The ID of the settled market.
    /// @param status The new status of the market after settlement.
    /// @param outcome The resolved outcome of the market.
    event SettlementResponse(
        uint256 indexed marketId,
        Status indexed status,
        Outcome indexed outcome
    );
    /// @notice Emitted when a settlement is requested for a market.
    /// @param marketId The ID of the market to settle.
    /// @param question The market's question string.
    event SettlementRequested(uint256 indexed marketId, string question);
    // ===========================
    // ======== ENUMS ============
    // ===========================

    /// @notice Possible outcomes for a market. Also serves as a user's chosen prediction.
    /// @dev `None` indicates no outcome yet or no prediction made, `Inconclusive` is used when AI response/confidence is insufficient. Users may only pass No or Yes.
    enum Outcome {
        None,
        No,
        Yes,
        Inconclusive
    }
    enum Status {
        Open,
        NeedsManual,
        SettlementRequested,
        Settled
    }

    // ===========================
    // ======== ERRORS ===========
    // ===========================

    error MarketNotClosed(uint256 nowTs, uint256 closeTs);
    error StatusNotOpen(Status current);
    error MarketAlreadySettled(uint256 settleTs);
    error InvalidOutcome();
    error InsufficientPayment(uint256 amt);

    error MarketNotOpen(uint256 nowTs, uint256 closeTs);
    error ManualSettlementNotAllowed(Status current);
    error AlreadyPredicted();
    error AmountZero();
    error MarketNotSettled(Status current);

    error NotSettledYet(Status current);
    error InsufficientLotSize(uint256 amount);
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
        bytes32 category;
        Outcome outcome;
        Status status; // Final outcome of the market
        uint256 settledAt; // Timestamp when settlement occurred
        string evidenceURI; // Response ID of the Gemini request
        uint16 confidenceBps; // Confidence level from Gemini (in basis points: 0–10000)
        uint256 yesShares; // Amount of yes shares bought or sold
        uint256 noShares; // Amount of no shares bought or sold
        uint256 liquidity; // total liqudity available for market
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

    mapping(uint256 => mapping(address => Prediction)) predictions;
    /// @notice ERC-20 token used for staking and payouts.
    /// @dev Set at deployment and immutable thereafter.
    // IERC20 public immutable paymentToken;

    /// @param forwarderAddress The address of the CRE forwarder contract that will call onReport().
    constructor(address forwarderAddress) ReceiverTemplate(forwarderAddress) {}

    // ===========================
    // ======== FUNCTIONS ========
    // ===========================
    function createMarket(
        string calldata _question,
        uint256 _duration,
        bytes32 _category,
        uint256 _liquidity
    ) external returns (uint256) {
        marketCount++;
        Market storage m = markets[marketCount];

        m.question = _question;
        m.category = _category;
        m.marketOpen = block.timestamp;
        m.marketClose = block.timestamp + _duration;
        m.liquidity = _liquidity;

        emit MarketCreated(marketCount, _question, block.timestamp + _duration);

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
    function buy(
        uint256 id,
        bool outcome,
        uint256 quoteAmount
    ) external payable {
        Market storage m = markets[id];

        if (m.marketClose < block.timestamp)
            revert MarketNotOpen(block.timestamp, m.marketClose);
        if (m.status != Status.Open) revert StatusNotOpen(m.status);
        if (m.status == Status.Settled)
            revert MarketAlreadySettled(m.settledAt);
        if (msg.value < quoteAmount) revert InsufficientPayment(msg.value);

        Prediction storage pred = predictions[id][msg.sender];

        if (outcome) {
            m.yesShares += msg.value;
            pred.yesAmount += msg.value;
            pred.lastSide = Outcome.Yes;
        } else {
            m.noShares += msg.value;
            pred.noAmount += msg.value;
            pred.lastSide = Outcome.No;
        }
        pred.lastUpdated = block.timestamp;
        emit Bought(id, msg.sender, outcome, msg.value);
    }

    /**
     * @notice Sell shares back to the pool.
     * @param minPayout The ETH expected back, calculated off-chain by CRE.
     */
    function sell(
        uint256 id,
        bool outcome,
        uint256 amount,
        uint256 minPayout
    ) external {
        Market storage m = markets[id];
        if (amount == 0) revert AmountZero();
        if (m.marketClose < block.timestamp)
            revert MarketNotOpen(block.timestamp, m.marketClose);
        if (m.status != Status.Open) revert StatusNotOpen(m.status);
        if (m.status == Status.Settled)
            revert MarketAlreadySettled(m.settledAt);
        if (amount <= 0) revert InsufficientLotSize(amount);

        Prediction storage pred = predictions[id][msg.sender];

        if (outcome) {
            require(pred.yesAmount >= amount, "Insufficient YES shares");
            pred.yesAmount -= amount; // Reduce prediction
            m.yesShares -= amount;
        } else {
            require(pred.noAmount >= amount, "Insufficient NO shares");
            pred.noAmount -= amount; // Reduce prediction
            m.noShares -= amount;
        }

        if (pred.yesAmount == 0 && pred.noAmount == 0)
            pred.lastSide = Outcome.None;
        pred.lastUpdated = block.timestamp;

        (bool success, ) = payable(msg.sender).call{value: minPayout}("");
        require(success, "ETH transfer failed");

        emit Sold(id, msg.sender, outcome, amount, minPayout);
    }

    /// @notice Request (CRE) to settle a market.
    /// @dev Emits a SettlementRequested event for monitoring.
    /// @param marketId The ID of the market to settle.
    function requestSettlement(uint256 marketId) public {
        Market storage m = markets[marketId];
        if (m.status != Status.Open) revert StatusNotOpen(m.status);
        if (m.marketClose > block.timestamp)
            revert MarketNotClosed(block.timestamp, m.marketClose);

        m.status = Status.SettlementRequested;
        emit SettlementRequested(marketId, m.question);
    }

    /// @notice Helper function invoked by _processReport.
    /// @param marketId The ID of the market being settled.
    /// @param outcome The resolved market outcome.
    /// @param confidenceBps Gemini confidence score in basis points (0–10000).
    /// @param evidenceURI responseId from Gemini request
    function settleMarket(
        uint256 marketId,
        Outcome outcome,
        uint16 confidenceBps,
        string memory evidenceURI
    ) private {
        Market storage m = markets[marketId];
        if (m.status != Status.SettlementRequested)
            revert SettlementNotRequested(m.status);

        if (m.status == Status.Settled)
            revert MarketAlreadySettled(m.settledAt);

        if (outcome == Outcome.Inconclusive) {
            m.status = Status.NeedsManual;
        } else {
            m.status = Status.Settled;
            m.settledAt = block.timestamp;
        }

        m.outcome = outcome;
        m.confidenceBps = confidenceBps;
        m.evidenceURI = evidenceURI;

        emit SettlementResponse(marketId, m.status, m.outcome);
    }

    /// @notice Used to manually settle markets that were set to NeedsManual due to inconclusive Gemini response.
    /// @param marketId The ID of the market being settled.
    /// @param outcome The resolved market outcome.
    function settleMarketManually(uint256 marketId, Outcome outcome) public {
        Market storage m = markets[marketId];
        if (m.status == Status.Settled)
            revert MarketAlreadySettled(m.settledAt);
        if (outcome != Outcome.No && outcome != Outcome.Yes)
            revert InvalidOutcome();
        if (m.status != Status.NeedsManual)
            revert ManualSettlementNotAllowed(m.status);

        m.status = Status.Settled;
        m.settledAt = block.timestamp;
        m.outcome = outcome;
        emit SettlementResponse(marketId, m.status, m.outcome);
    }

    /// @notice Internal hook to process settlement reports from the receiver template.
    /// @dev Decodes ABI-encoded data and calls settleMarket().
    /// @param report ABI-encoded (marketId, outcome(uint8), confidenceBps, responseId).
    function _processReport(bytes calldata report) internal override {
        (
            uint256 marketId,
            uint8 outcome,
            uint16 confidenceBps,
            string memory responseId
        ) = abi.decode(report, (uint256, uint8, uint16, string));
        settleMarket(marketId, Outcome(outcome), confidenceBps, responseId);
    }

    /// @notice Returns the evidence URI for a given market.
    /// @param marketId The ID of the market.
    /// @return The constructed URI string.
    function getUri(uint256 marketId) public view returns (string memory) {
        return
            string.concat(
                "http://localhost:3000/",
                markets[marketId].evidenceURI
            );
    }

    /// @notice Claim winnings after a market is settled.
    /// @dev Distributes the total pool proportionally among correct predictors.
    /// @param marketId The ID of the settled market.
    function claimWinnings(uint256 marketId) external {
        Market storage m = markets[marketId];
        Prediction storage pred = predictions[marketId][msg.sender];
        if (m.status != Status.Settled) revert MarketNotSettled(m.status);
        if (m.settledAt < block.timestamp) revert MarketNotSettled(m.status);
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
        pred.claimed = true;
        (bool success, ) = payable(msg.sender).call{value: totalPayout}("");
        require(success, "Claim failed");

        emit Claimed(marketId, msg.sender, totalPayout);
    }

    function getMarketCount() public view returns (uint256) {
        return marketCount;
    }

    function getPrediction(
        uint256 marketId
    ) public view returns (Prediction memory) {
        return predictions[marketId][msg.sender];
    }
}
