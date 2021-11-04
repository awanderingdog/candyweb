import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import "@fontsource/lora";
import {
  Button,
  CircularProgress,
  Snackbar,
  Container,
  Box,
  Typography,
  Hidden,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import * as anchor from "@project-serum/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";
// import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";
import "../index.css";
import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "../utils/candy-machine";
import MintButton from "../components/MintButton";

const connection = new anchor.web3.Connection(
  "https://explorer-api.devnet.solana.com"
);

const CANDYMACHINE = {
  id: new PublicKey("CnzAJy8iq57bPSwU41i4HfhYMVbs3VvLATquxrvd9sUA"),
  treasury: new PublicKey("HejLuohXenFxU99ERaij3FWHpi7mfJiNZYDnPUdQL9sT"),
  config: new PublicKey("BsefQ8Q5QzQDVvbPfhFPa5qUP3mbY3vtGpXwd9F2J7RH"),
  startDate: 818035920,
  txTimeout: 30000,
};

const TierOne = () => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(CANDYMACHINE.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  if (wallet) {
    connection.getBalance(wallet.publicKey).then((balance) => {
      setBalance(balance / LAMPORTS_PER_SOL);
    });
  }

  const onSuccess = () => {
    setAlertState({
      open: true,
      message: "Congratulations! Mint succeeded!",
      severity: "success",
    });
  };
  const onError = () => {
    setAlertState({
      open: true,
      message: "Mint failed! Please try again!",
      severity: "error",
    });
  };

  return (
    <div id="box">
      <Container component="main" maxWidth="lg">
        <Box
          sx={{
            marginTop: 240,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              marginTop: 8,
              marginBottom: 8,
              maxWidth: "100%",
              overflow: "hidden",
            }}
          ></Box>
          <Box>
            <Box sx={{ marginBottom: 12 }}>
              <Typography
                style={{ fontSize: "25px", fontWeight: "bold" }}
                id="header"
              >
                A Wandering Dog
              </Typography>
            </Box>
          </Box>
          {/* {wallet && <p>Address: {wallet.publicKey.toBase58()}</p>} */}

          <Box
            sx={{
              marginBottom: 20,
            }}
          >
            <Typography style={{ fontSize: "20px" }}>whitelist mint</Typography>
          </Box>
          <Box
            sx={{
              margin: 10,
            }}
          >
            <Typography style={{ fontSize: "15px", fontStyle: "italic" }}>
              mint price: 3 sol
            </Typography>
          </Box>
          <Box
            sx={{
              margin: 0,
            }}
          >
            {!wallet ? (
              <WalletDialogButton
                style={{ background: "white", color: "black" }}
              >
                Connect Wallet
              </WalletDialogButton>
            ) : (
              <MintButton
                connection={connection}
                candyMachineId={CANDYMACHINE.id}
                config={CANDYMACHINE.config}
                startDate={CANDYMACHINE.startDate}
                treasury={CANDYMACHINE.treasury}
                txTimeout={CANDYMACHINE.txTimeout}
                onSuccess={onSuccess}
                onError={onError}
                setItemsRemaining={setItemsRemaining}
                setItemsAvailable={setItemsAvailable}
                setItemsRedeemed={setItemsRedeemed}
              ></MintButton>
            )}
            {wallet && (
              <Typography style={{ fontSize: "15px", fontStyle: "italic" }}>
                {/* Balance {(balance || 0).toLocaleString()} SOL */}
                {wallet && <p>remaining: {itemsRemaining} nfts</p>}
                {wallet && <p>total: {itemsAvailable} nfts</p>}
              </Typography>
            )}
          </Box>

          <Snackbar
            open={alertState.open}
            autoHideDuration={6000}
            onClose={() => setAlertState({ ...alertState, open: false })}
          >
            <Alert
              onClose={() => setAlertState({ ...alertState, open: false })}
              severity={alertState.severity}
            >
              {alertState.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </div>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

export default TierOne;
