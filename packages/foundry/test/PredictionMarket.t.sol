// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {PredictionMarket} from "../contracts/PredictionMarket.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    event PriceUpdated(
        uint256 indexed id,
        address indexed user,
        bool outcome,
        uint256 amount,
        uint256 yesPrice,
        uint256 noPrice,
        uint256 timeStamp
    );

    function setUp() public {
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
        market = new PredictionMarket();
    }

    function test_createMarket() public {
        uint256 marketId = _createMarket();

        assertEq(marketId, 1);

        (
            string memory question,
            ,
            uint256 marketClose,
            uint8 status,
            uint8 outcome,
            ,
            ,
            ,
            uint8 resolution_type,
            ,
            string memory criteria,
            uint8 category,
            uint256 liquidity,

        ) = _readMarket(marketId);

        assertEq(question, "Will ETH reach $10k in 2026?");

        assertEq(marketClose, 1 days);
        assertEq(status, uint8(PredictionMarket.Status.Open));
        assertEq(outcome, uint8(PredictionMarket.Outcome.None));
        assertEq(criteria, "Binance Price Feed");
        assertEq(resolution_type, uint8(PredictionMarket.Channel.None));
        assertEq(category, uint8(PredictionMarket.MarketCategory.Crypto));
        assertEq(liquidity, 1 ether);
    }

    // -------------------------
    // // PRICE ACTION
    // // -------------------------

    function testInitialPriceIs50Percent() public {
        uint256 marketId = _createMarket();
        (uint256 yes, uint256 no) = market.getPrices(marketId);

        assertEq(yes, 0.5e18);
        assertEq(no, 0.5e18);
    }

    /**
     * @notice Tests that buying YES increases YES price and decreases NO price.
     */
    function testPriceImpactOnBuy() public {
        uint256 marketId = _createMarket();

        vm.prank(bob);
        market.buy{value: 2 ether}(marketId, true); // Buy YES
        (uint256 yesPrice, uint256 noPrice) = market.getPrices(marketId);
        assertTrue(yesPrice > 0.5e18);
        assertTrue(noPrice < 0.5e18);
        // Sum should always be 1.0 (approx due to wad division)
        assertApproxEqAbs(
            yesPrice + noPrice,
            1e18,
            100,
            "Sum of prices should be 1.0"
        );
    }

    function testPriceActionEmitCorrectData() public {
        uint256 id = _createMarket();

        // We expect the event to trigger with specific data
        // We use 'expectEmit' to check the yesPrice and noPrice values are present
        vm.expectEmit(true, true, false, true);
        // Note: We don't know the exact price yet, so we'll check it via logs in the actual test
        emit PriceUpdated(
            id,
            alice,
            true,
            1 ether,
            731058578630004879,
            268941421369995120,
            block.timestamp
        );

        vm.prank(alice);
        market.buy{value: 1 ether}(id, true);
    }
    // // -------------------------
    // // BUY
    // // -------------------------

    function testBuyYes() public {
        uint256 marketId = _createMarket();
        vm.startPrank(alice);

        market.buy{value: 1 ether}(marketId, true);
        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.yesAmount, 1 ether);
        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.Yes)
        );

        vm.stopPrank();

        (, , , , , , uint256 yesShares, , , , , , , ) = _readMarket(marketId);
        assertEq(yesShares, 1 ether);
    }

    function testBuyNo() public {
        uint256 marketId = _createMarket();
        vm.startPrank(alice);

        market.buy{value: 1 ether}(marketId, false);
        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.noAmount, 1 ether);
        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.No)
        );
        PredictionMarket.Market memory m = market.getMarketInfo(marketId);
        assertEq(m.yesShares, 0);
        assertEq(m.noShares, 1 ether);

        vm.stopPrank();
    }

    // // -------------------------
    // // SELL
    // // -------------------------
    function testParticipantTracking() public {
        uint256 marketId = _createMarket();
        vm.prank(alice);
        market.buy{value: 1 ether}(marketId, true);

        vm.prank(bob);
        market.buy{value: 1 ether}(marketId, false);
        PredictionMarket.Market memory m = market.getMarketInfo(marketId);
        assertEq(m.totalParticipants, 2);

        vm.prank(alice);
        market.sell(marketId, true, 1 ether, 0);
        m = market.getMarketInfo(marketId);
        assertEq(m.totalParticipants, 1);
    }

    function testSellYes() public {
        uint256 marketId = _createMarket();

        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, true);

        market.sell(marketId, true, 1 ether, 0);

        PredictionMarket.Market memory m = market.getMarketInfo(marketId);
        assertEq(m.yesShares, 1 ether);
        assertEq(m.noShares, 0);

        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.noAmount, 0);
        assertEq(prediction.yesAmount, 1 ether);
    }

    function testSellNo() public {
        uint256 marketId = _createMarket();
        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, false);

        market.sell(marketId, false, 0.5 ether, 0);

        PredictionMarket.Market memory m = market.getMarketInfo(marketId);
        assertEq(m.yesShares, 0);
        assertEq(m.noShares, 1.5 ether);

        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.noAmount, 1.5 ether);
        assertEq(prediction.yesAmount, 0);
    }

    function testSellRevertsIfNotEnoughShares() public {
        uint256 marketId = _createMarket();
        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, true);

        vm.expectRevert(PredictionMarket.InsufficientShares.selector);
        market.sell(marketId, true, 3 ether, 0);
        vm.stopPrank();
    }

    function testSellItResetsLastSideIfNoShares() public {
        uint256 marketId = _createMarket();
        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, true);
        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.Yes)
        );
        market.sell(marketId, true, 2 ether, 0);

        prediction = market.getPrediction(marketId);
        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.None)
        );

        vm.stopPrank();
    }

    function testTradeRevertsIfMarketIsClosed() public {
        uint256 marketId = _createMarket();
        uint256 newTimeStamp = block.timestamp + 1 days + 5 minutes;
        vm.warp(newTimeStamp);
        vm.startPrank(alice);

        (, , uint256 close, , , , , , , , , , , ) = _readMarket(marketId);
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.MarketNotOpen.selector,
                block.timestamp,
                close
            )
        );
        market.buy{value: 2 ether}(marketId, true);
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.MarketNotOpen.selector,
                block.timestamp,
                close
            )
        );
        market.sell(marketId, true, 2 ether, 0);

        vm.stopPrank();
    }

    // // ================================================================
    // //                       SETTLEMENT EXECUTION
    // // ================================================================

    function testSettleMarket() public {
        uint256 marketId = _prepareAndCloseMarket("Gang Ho..!");
        market.settleMarket(marketId, PredictionMarket.Outcome.Yes, 1000);
        PredictionMarket.Market memory m = market.getMarketInfo(marketId);

        assertEq(uint8(m.status), uint8(PredictionMarket.Status.Settled));
        assertEq(uint8(m.outcome), uint8(PredictionMarket.Outcome.Yes));
        assertEq(
            uint8(m.resolutionChannel),
            uint8(PredictionMarket.Channel.Gemini)
        );
        assertGt(m.marketClose, 0);
        //assertEq(evidence, "evidence-123");
        assertEq(m.confidenceBps, 1000);
    }

    // // ================================================================
    // //                     MANUAL SETTLEMENT FLOW
    // // ================================================================
    function testInconclusiveThenManualSettlement() public {
        uint256 marketId = _prepareAndCloseMarket("Q");

        market.settleMarket(
            marketId,
            PredictionMarket.Outcome.Inconclusive,
            1000
        );
        (, , , uint8 status, uint8 outcome, , , , , , , , , ) = _readMarket(
            marketId
        );

        assertEq(status, uint8(PredictionMarket.Status.NeedsManual));

        assertEq(outcome, uint8(PredictionMarket.Outcome.Inconclusive));

        // Step 2: Manual settlement NOW finalizes the market (status = Settled)

        vm.expectEmit();
        emit PredictionMarket.SettlementResponse(
            marketId,
            PredictionMarket.Status.Settled,
            PredictionMarket.Outcome.Yes
        );
        market.settleMarketManually(marketId, PredictionMarket.Outcome.Yes);

        (
            ,
            ,
            ,
            uint8 status2,
            uint8 outcome2,
            ,
            ,
            ,
            uint8 channelType2,
            ,
            ,
            ,
            ,

        ) = _readMarket(marketId);
        assertEq(channelType2, uint8(PredictionMarket.Channel.Manual));
        assertEq(status2, uint8(PredictionMarket.Status.Settled));
        assertEq(outcome2, uint8(PredictionMarket.Outcome.Yes));
    }

    // /**
    //  * @notice Ensures manual settlement cannot occur if status != NeedsManual.
    //  */
    function testSettlementRevertsWhenWrongStatus() public {
        uint256 marketId = _prepareAndCloseMarket("Q");

        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.ManualSettlementNotAllowed.selector,
                PredictionMarket.Status.Open
            )
        );
        market.settleMarketManually(marketId, PredictionMarket.Outcome.Yes);
    }

    // // ================================================================
    // //                         CLAIMS & PAYOUTS
    // // ================================================================
    function testClaimWithProfit() public {
        uint256 marketId = _createMarket();

        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true);

        uint256 bobBalanceBefore = bob.balance;
        //Bob bets 3 ether on NO
        vm.prank(bob);
        market.buy{value: 3 ether}(marketId, false);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);

        market.settleMarket(marketId, PredictionMarket.Outcome.Yes, 1000);
        uint256 balanceBefore = alice.balance;
        //Alice claims 1.5 ether
        vm.prank(alice);
        market.claimWinnings(marketId);
        //uint256 profit = (stake * losingPool) / winningPool;
        assertEq(alice.balance, balanceBefore + 5 ether);
        //bob has lost 3 ether
        assertEq(bobBalanceBefore - bob.balance, 3 ether);
    }

    function testClaimWithProfitMultipleBets() public {
        uint256 marketId = _createMarket();

        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true);

        //Bob bets 3 ether on NO
        vm.prank(bob);
        market.buy{value: 3 ether}(marketId, false);

        //Carol bets 1 ether on Yes
        vm.prank(carol);
        market.buy{value: 1 ether}(marketId, true);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);
        market.requestSettlement(marketId);
        market.settleMarket(marketId, PredictionMarket.Outcome.Yes, 1000);
        //uint256 profit = (stake * losingPool) / winningPool;
        uint256 balanceBefore = alice.balance;
        uint256 carolBalanceBefore = carol.balance;
        //Alice claims 1.5 ether
        vm.prank(alice);
        market.claimWinnings(marketId);
        assertEq(alice.balance, balanceBefore + 4 ether);

        vm.prank(carol);
        market.claimWinnings(marketId);
        assertEq(carol.balance, carolBalanceBefore + 2 ether);
    }

    /**
     * @notice Security Test: Ensure user cannot drain more ETH than the curve allows.
     */
    function testSlippageRevert() public {
        uint256 id = _createMarket();

        vm.prank(alice);
        market.buy{value: 1 ether}(id, true);

        vm.prank(alice);
        // User expects 10 ETH back for a 1 ETH stake (Impossible)
        vm.expectRevert(PredictionMarket.SlippageExceeded.selector);
        market.sell(id, true, 1 ether, 10 ether);
    }

    function testClaimWhenLoosingPoolIsZero() public {
        uint256 marketId = _createMarket();
        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);

        market.settleMarket(marketId, PredictionMarket.Outcome.Yes, 1000);
        uint256 balanceBefore = alice.balance;
        //Alice claims 2 ether
        vm.prank(alice);
        market.claimWinnings(marketId);
        assertEq(alice.balance - balanceBefore, 2 ether);
        assertEq(address(market).balance, 1 ether);
    }

    function testLoosersCannotClaim() public {
        uint256 marketId = _createMarket();

        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);

        market.settleMarket(marketId, PredictionMarket.Outcome.No, 1000);

        //Alice claims 2 ether
        vm.startPrank(alice);
        vm.expectRevert(PredictionMarket.IncorrectPrediction.selector);
        market.claimWinnings(marketId);
    }

    function testCannotClaimTwice() public {
        uint256 marketId = _createMarket();
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);

        market.settleMarket(marketId, PredictionMarket.Outcome.Yes, 1000);
        vm.prank(alice);
        market.claimWinnings(marketId);
        //second attempt to claim
        vm.startPrank(alice);

        vm.expectRevert(PredictionMarket.AlreadyClaimed.selector);
        market.claimWinnings(marketId);
    }

    function testCannotClaimWhenBeforeSettlement() public {
        uint256 marketId = _createMarket();
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true);
        (, , , uint8 status, , , , , , , , , , ) = _readMarket(marketId);
        vm.startPrank(alice);

        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.MarketNotSettled.selector,
                status
            )
        );
        market.claimWinnings(marketId);
    }

    function _readMarket(
        uint256 id
    )
        internal
        view
        returns (
            string memory question,
            uint256 open,
            uint256 close,
            uint8 status,
            uint8 outcome,
            uint256 settledAt,
            uint256 yesShares,
            uint256 noShares,
            uint8 resolutionChannel,
            uint16 confidenceBps,
            string memory criteria,
            uint8 category,
            uint256 liquidity,
            uint256 totalParticipants

            //tring memory evidence
        )
    {
        PredictionMarket.Market memory m = market.getMarketInfo(id);
        return (
            m.question,
            m.marketOpen,
            m.marketClose,
            uint8(m.status),
            uint8(m.outcome),
            m.settledAt,
            m.yesShares,
            m.noShares,
            uint8(m.resolutionChannel),
            m.confidenceBps,
            m.criteria,
            uint8(m.category),
            m.liquidity,
            m.totalParticipants
        );
    }

    /// @dev Opens a new market, advances time beyond close, and requests settlement.
    function _prepareAndCloseMarket(
        string memory question
    ) internal returns (uint256 id) {
        id = market.createMarket{value: 3 ether}(
            question,
            1 days,
            "criteria",
            PredictionMarket.MarketCategory.Crypto
        );
        vm.warp(block.timestamp + 1 days + 5 minutes);
    }

    function _createMarket() internal returns (uint256) {
        return
            market.createMarket{value: 1 ether}(
                "Will ETH reach $10k in 2026?",
                1 days,
                "Binance Price Feed",
                PredictionMarket.MarketCategory.Crypto
            );
    }
}
