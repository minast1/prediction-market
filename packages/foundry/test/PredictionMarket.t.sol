// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {PredictionMarket} from "../contracts/PredictionMarket.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address internal forwarderAddress =
        address(0x15fC6ae953E024d975e77382eEeC56A9101f9F88);
    // Events from SimpleMarket used for validation with `vm.expectEmit`
    event SettlementRequested(uint256 indexed marketId, string question);
    event SettlementResponse(
        uint256 indexed marketId,
        PredictionMarket.Status indexed status,
        PredictionMarket.Outcome indexed outcome
    );

    function setUp() public {
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
        market = new PredictionMarket(forwarderAddress);
    }

    function test_createMarket() public {
        uint256 marketId = market.createMarket(
            "The New York Yankees will win the 2009 world series.",
            5 days,
            PredictionMarket.MarketCategory.Crypto,
            2 ether
        );
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
            ,

        ) = _readMarket(marketId);

        assertEq(
            question,
            "The New York Yankees will win the 2009 world series."
        );

        assertEq(marketClose, block.timestamp + 5 days);
        assertEq(status, uint8(PredictionMarket.Status.Open));
        assertEq(outcome, uint8(PredictionMarket.Outcome.None));
    }

    // -------------------------
    // BUY
    // -------------------------

    function testBuyYes() public {
        uint256 marketId = market.createMarket(
            "The New York Yankees will win the 2009 world series.",
            5 days,
            PredictionMarket.MarketCategory.Crypto,
            2 ether
        );
        vm.startPrank(alice);

        market.buy{value: 1 ether}(marketId, true, 1 ether);
        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.yesAmount, 1 ether);
        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.Yes)
        );

        vm.stopPrank();

        (, , , , , , uint256 yesShares, , , ) = _readMarket(marketId);
        assertEq(yesShares, 1 ether);
    }

    function testBuyNo() public {
        uint256 marketId = market.createMarket(
            "The New York Yankees will win the 2009 world series.",
            5 days,
            PredictionMarket.MarketCategory.Crypto,
            2 ether
        );
        vm.startPrank(alice);

        market.buy{value: 1 ether}(marketId, false, 1 ether);
        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.noAmount, 1 ether);
        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.No)
        );

        (, , , , , , uint256 yesShares, uint256 noShares, , ) = _readMarket(
            marketId
        );
        assertEq(yesShares, 0);
        assertEq(noShares, 1 ether);

        vm.stopPrank();
    }

    function testRevertBuyInsufficientPayment() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );

        vm.startPrank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.InsufficientPayment.selector,
                0.5 ether
            )
        );
        market.buy{value: 0.5 ether}(marketId, true, 1 ether);
    }

    // -------------------------
    // SELL
    // -------------------------

    function testSellYes() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);

        market.sell(marketId, true, 1 ether, 1 ether);

        (, , , , , , uint256 yesShares, uint256 noShares, , ) = _readMarket(
            marketId
        );
        assertEq(yesShares, 1 ether);
        assertEq(noShares, 0);

        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.noAmount, 0);
        assertEq(prediction.yesAmount, 1 ether);
    }

    function testSellNo() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, false, 2 ether);

        market.sell(marketId, false, 0.5 ether, 1 ether);

        (, , , , , , uint256 yesShares, uint256 noShares, , ) = _readMarket(
            marketId
        );
        assertEq(yesShares, 0);
        assertEq(noShares, 1.5 ether);

        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(prediction.noAmount, 1.5 ether);
        assertEq(prediction.yesAmount, 0);
    }

    function testSellRevertsIfNotEnoughShares() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);
        vm.expectRevert("Insufficient YES shares");
        market.sell(marketId, true, 3 ether, 4 ether);
    }

    function testSellItResetsLastSideIfNoShares() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        vm.startPrank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);
        PredictionMarket.Prediction memory prediction = market.getPrediction(
            marketId
        );
        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.Yes)
        );
        market.sell(marketId, true, 2 ether, 2 ether);

        assertEq(
            uint8(prediction.lastSide),
            uint8(PredictionMarket.Outcome.Yes)
        );

        vm.stopPrank();
    }

    function testBuyRevertsIfMarketIsClosed() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        uint256 newTimeStamp = block.timestamp + 1 days + 5 minutes;
        vm.warp(newTimeStamp);
        vm.startPrank(alice);

        (, , uint256 close, , , , , , , ) = _readMarket(marketId);
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.MarketNotOpen.selector,
                block.timestamp,
                close
            )
        );
        market.buy{value: 2 ether}(marketId, true, 2 ether);
        // market.sell(marketId, true, 2 ether, 2 ether);

        vm.stopPrank();
    }

    function testSellRevertsIfNoShares() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        vm.startPrank(alice);

        vm.expectRevert("Insufficient NO shares");
        market.sell(marketId, false, 3 ether, 4 ether);
    }

    // ================================================================
    //                        SETTLEMENT REQUEST
    // ================================================================

    function testSettlementRequest() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        uint256 newTimeStamp = block.timestamp + 1 days + 5 minutes;
        vm.warp(newTimeStamp);
        vm.prank(alice);
        market.requestSettlement(marketId);

        (, , , uint8 status, , , , , , ) = _readMarket(marketId);
        assertEq(status, uint8(PredictionMarket.Status.SettlementRequested));
    }

    function testRequestSettlementRevertsIfMarketIsOpen() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        (, , uint256 close, , , , , , , ) = _readMarket(marketId);
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.MarketNotClosed.selector,
                block.timestamp,
                close
            )
        );
        market.requestSettlement(marketId);
    }

    function testRequestSettlementRevertsIfStatusNotOpen() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        uint256 newTimeStamp = block.timestamp + 1 days + 5 minutes;
        vm.warp(newTimeStamp);

        vm.startPrank(alice);

        market.requestSettlement(marketId);
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.StatusNotOpen.selector,
                PredictionMarket.Status.SettlementRequested
            )
        );
        market.requestSettlement(marketId);
    }

    // ================================================================
    //                       SETTLEMENT EXECUTION
    // ================================================================

    function testSettleMarket() public {
        uint256 marketId = _prepareAndRequestSettlement("Gang Ho..!");
        vm.expectEmit();
        emit SettlementResponse(
            marketId,
            PredictionMarket.Status.Settled,
            PredictionMarket.Outcome.Yes
        );
        vm.prank(forwarderAddress);
        market.onReport(
            "",
            abi.encode(
                marketId,
                PredictionMarket.Outcome.Yes,
                9_500,
                "evidence-123"
            )
        );

        vm.stopPrank();
        (
            ,
            ,
            uint256 close,
            uint8 status,
            uint8 outcome,
            ,
            ,
            ,
            string memory evidence,
            uint16 confidence
        ) = _readMarket(marketId);
        assertEq(status, uint8(PredictionMarket.Status.Settled));
        assertEq(outcome, uint8(PredictionMarket.Outcome.Yes));
        assertGt(close, 0);
        assertEq(evidence, "evidence-123");
        assertEq(confidence, 9_500);
    }

    function testTradeRevertsIfMarketIsSettled() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            3 ether
        );
        uint256 newTimeStamp = block.timestamp + 1 days + 5 minutes;
        vm.warp(newTimeStamp);
        vm.startPrank(alice);

        (, , uint256 close, , , , , , , ) = _readMarket(marketId);
        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.MarketNotOpen.selector,
                block.timestamp,
                close
            )
        );
        market.buy{value: 2 ether}(marketId, true, 2 ether);

        vm.stopPrank();
    }

    // ================================================================
    //                     MANUAL SETTLEMENT FLOW
    // ================================================================
    function testInconclusiveThenManualSettlement() public {
        uint256 marketId = _prepareAndRequestSettlement("Q");
        vm.prank(forwarderAddress);
        market.onReport(
            "",
            abi.encode(
                marketId,
                PredictionMarket.Outcome.Inconclusive,
                9_500,
                "evidence-123"
            )
        );
        vm.stopPrank();
        (, , , uint8 status, uint8 outcome, , , , , ) = _readMarket(marketId);

        assertEq(status, uint8(PredictionMarket.Status.NeedsManual));
        assertEq(outcome, uint8(PredictionMarket.Outcome.Inconclusive));

        // Step 2: Manual settlement NOW finalizes the market (status = Settled)
        vm.expectEmit();
        emit SettlementResponse(
            marketId,
            PredictionMarket.Status.Settled,
            PredictionMarket.Outcome.Yes
        );
        market.settleMarketManually(marketId, PredictionMarket.Outcome.Yes);

        (, , , uint8 status2, uint8 outcome2, , , , , ) = _readMarket(marketId);
        assertEq(status2, uint8(PredictionMarket.Status.Settled));
        assertEq(outcome2, uint8(PredictionMarket.Outcome.Yes));
    }

    /**
     * @notice Ensures manual settlement cannot occur if status != NeedsManual.
     */
    function testSettlementRevertsWhenWrongStatus() public {
        uint256 marketId = _prepareAndRequestSettlement("Q");

        vm.expectRevert(
            abi.encodeWithSelector(
                PredictionMarket.ManualSettlementNotAllowed.selector,
                PredictionMarket.Status.SettlementRequested
            )
        );
        market.settleMarketManually(marketId, PredictionMarket.Outcome.Yes);
    }

    // ================================================================
    //                         CLAIMS & PAYOUTS
    // ================================================================
    function testClaimWithProfit() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            3 ether
        );

        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);

        uint256 bobBalanceBefore = bob.balance;
        //Bob bets 3 ether on NO
        vm.prank(bob);
        market.buy{value: 3 ether}(marketId, false, 3 ether);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);
        market.requestSettlement(marketId);
        vm.prank(forwarderAddress);
        market.onReport(
            "",
            abi.encode(
                marketId,
                PredictionMarket.Outcome.Yes,
                9_500,
                "evidence-123"
            )
        );
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
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            3 ether
        );

        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);

        //Bob bets 3 ether on NO
        vm.prank(bob);
        market.buy{value: 3 ether}(marketId, false, 3 ether);

        //Carol bets 1 ether on Yes
        vm.prank(carol);
        market.buy{value: 1 ether}(marketId, true, 1 ether);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);
        market.requestSettlement(marketId);
        vm.prank(forwarderAddress);
        market.onReport(
            "",
            abi.encode(
                marketId,
                PredictionMarket.Outcome.Yes,
                9_500,
                "evidence-123"
            )
        );
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

    function testClaimWhenLoosingPoolIsZero() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            3 ether
        );

        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);
        market.requestSettlement(marketId);
        vm.prank(forwarderAddress);
        market.onReport(
            "",
            abi.encode(
                marketId,
                PredictionMarket.Outcome.Yes,
                9_500,
                "evidence-123"
            )
        );
        uint256 balanceBefore = alice.balance;
        //Alice claims 2 ether
        vm.prank(alice);
        market.claimWinnings(marketId);
        assertEq(alice.balance - balanceBefore, 2 ether);
        assertEq(address(market).balance, 0);
    }

    function testLoosersCannotClaim() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            3 ether
        );

        //Alice bets 2 ether on YES
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);
        market.requestSettlement(marketId);
        vm.prank(forwarderAddress);
        market.onReport(
            "",
            abi.encode(
                marketId,
                PredictionMarket.Outcome.No,
                9_500,
                "evidence-123"
            )
        );

        //Alice claims 2 ether
        vm.startPrank(alice);
        vm.expectRevert(PredictionMarket.IncorrectPrediction.selector);
        market.claimWinnings(marketId);
    }

    function testCannotClaimTwice() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            3 ether
        );
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);

        //Fast forward and resolve market
        vm.warp(block.timestamp + 1 days + 5 minutes);
        market.requestSettlement(marketId);
        vm.prank(forwarderAddress);
        market.onReport(
            "",
            abi.encode(
                marketId,
                PredictionMarket.Outcome.Yes,
                9_500,
                "evidence-123"
            )
        );
        vm.prank(alice);
        market.claimWinnings(marketId);
        //second attempt to claim
        vm.startPrank(alice);

        vm.expectRevert(PredictionMarket.AlreadyClaimed.selector);
        market.claimWinnings(marketId);
    }

    function testCannotClaimWhenBeforeSettlement() public {
        uint256 marketId = market.createMarket(
            "Q",
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            3 ether
        );
        vm.prank(alice);
        market.buy{value: 2 ether}(marketId, true, 2 ether);
        (, , , uint8 status, , , , , , ) = _readMarket(marketId);
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
            string memory evidenceURI,
            uint16 confidenceBps

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
            m.evidenceURI,
            m.confidenceBps
        );
    }

    /// @dev Opens a new market, advances time beyond close, and requests settlement.
    function _prepareAndRequestSettlement(
        string memory question
    ) internal returns (uint256 id) {
        id = market.createMarket(
            question,
            1 days,
            PredictionMarket.MarketCategory.Crypto,
            1 ether
        );
        vm.warp(block.timestamp + 1 days + 5 minutes);
        market.requestSettlement(id);
    }
}
