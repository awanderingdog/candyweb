import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet } from "@solana/wallet-adapter-react";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintMultipleToken,
} from "../utils/candy-machine";

const CounterText = styled.span``; // add your styles here

export interface MintButtonProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
  amount: number;
  setItemsAvailable: (items: number) => void;
  setItemsRedeemed: (items: number) => void;
  setItemsRemaining: (items: number) => void;

  onSuccess?: (success: any) => void;
  onError?: (error: any) => void;
}

const MintButton = (props: MintButtonProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
  const setItemsAvailable = props.setItemsAvailable;
  const setItemsRemaining = props.setItemsRemaining;
  const setItemsRedeemed = props.setItemsRedeemed;

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintMultipleToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury,
          props.amount
        );

        // const mintTxId = await mintOneToken(
        //   candyMachine,
        //   props.config,
        //   wallet.publicKey,
        //   props.treasury
        // );

        // const status = await awaitTransactionSignatureConfirmation(
        //   mintTxId,
        //   props.txTimeout,
        //   props.connection,
        //   "singleGossip",
        //   false
        // );

        console.log('minting result: ', mintTxId);
        
        // if (!status?.err) {
        //   //success
        //   if (props.onSuccess) props.onSuccess(true);
        // } else {
        //   // error
        //   if (props.onError) props.onError("Mint failed! Please try again!s");
        // }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      if (props.onError) props.onError(message);
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(() => {
    (async () => {
      if (!wallet) return;

      const {
        candyMachine,
        goLiveDate,
        itemsRemaining,
        itemsAvailable,
        itemsRedeemed,
      } = await getCandyMachineState(
        wallet as anchor.Wallet,
        props.candyMachineId,
        props.connection
      );

      console.log(
        await getCandyMachineState(
          wallet as anchor.Wallet,
          props.candyMachineId,
          props.connection
        )
      );

      setItemsAvailable(itemsAvailable);
      setItemsRedeemed(itemsRedeemed);
      setItemsRemaining(itemsRemaining);

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  }, [wallet, props.candyMachineId, props.connection]);

  return (
    <Button
      disabled={isSoldOut || isMinting || !isActive}
      onClick={onMint}
      variant="contained"
      style={{
        padding: "18px 45px",
        fontSize: "20px",
        fontWeight: "bold",
        background: "#CCCCCD",
        color: "#666666",
        border: "none",
        borderRadius: "10px",
      }}
    >
      {isSoldOut ? (
        "SOLD OUT"
      ) : isActive ? (
        isMinting ? (
          <CircularProgress />
        ) : (
          "MINT"
        )
      ) : (
        <Countdown
          date={startDate}
          onMount={({ completed }) => completed && setIsActive(true)}
          onComplete={() => setIsActive(true)}
          renderer={renderCounter}
        />
      )}
    </Button>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default MintButton;
