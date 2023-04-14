import React from "react";
// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import MetaMaskSDK from "@metamask/sdk";
import detectEthereumProvider from "@metamask/detect-provider";
// eslint-disable-next-line no-unused-vars
import { ethers } from "ethers";
import Web3 from "web3";
import "./App.css";
// JSON containing ABI and Bytecode of compiled smart contracts
import contractJson from "./abis/Greeter.json";

new MetaMaskSDK({
  useDeeplink: false,
  communicationLayerPreference: "socket",
});

function App() {
  const [mmStatus, setMmStatus] = useState("Not connected!");
  const [isConnected, setIsConnected] = useState(false);
  const [accountAddress, setAccountAddress] = useState(undefined);
  const [displayMessage, setDisplayMessage] = useState("");
  // eslint-disable-next-line
  const [web3, setWeb3] = useState(undefined);
  const [getNetwork, setGetNetwork] = useState(undefined);
  const [contracts, setContracts] = useState(undefined);
  // eslint-disable-next-line
  const [contractAddress, setContractAddress] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [txnHash, setTxnHash] = useState(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      // Define web3
      const web3 = new Web3(window.ethereum);
      setWeb3(web3);
      // get networkId
      const networkId = await web3.eth.getChainId();
      setGetNetwork(networkId);
      // INSERT deployed smart contract address
      const contractAddress = "0xECbfe4D32D478F7D16Cf959eD2B0Fb1253a842EB";
      setContractAddress(contractAddress);
      // Instantiate smart contract instance
      const Greeter = new web3.eth.Contract(contractJson.abi, contractAddress);
      setContracts(Greeter);
      // Set provider
      Greeter.setProvider(window.ethereum);
    })();
  }, []);

  // eslint-disable-next-line no-undef
  if (ethereum._metamask.isUnlocked()) {
    console.log("Metamask is unlocked");
  } else {
    console.log("Metamask is locked");
  }

  // change account if metamask account is changed
  useEffect(() => {
    if (isConnected) {
      window.ethereum.on("accountsChanged", function (accounts) {
        setAccountAddress(accounts[0]);
        web3.eth.getBalance(accounts[0]).then((bal) => {
          setBalance(web3.utils.fromWei(bal, "ether"));
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // // check the balance of the account
  // useEffect(() => {
  //   if (isConnected) {
  //     web3.eth.getBalance(accountAddress).then((bal) => {
  //       setBalance(web3.utils.fromWei(bal, "ether"));
  //     });
  //   }
  // }, [isConnected]);

  // Connect to Metamask
  async function ConnectWallet() {
    const provider = await detectEthereumProvider();
    if (provider) {
      // From now on, this should always be true:
      // eslint-disable-next-line no-unused-expressions
      provider === window.ethereum;
      // eslint-disable-next-line no-undef
      console.log("Metamask Available");
    } else {
      window.alert("Please install MetaMask!");
    }
    // Check if Metamask is installed
    if (typeof window.ethereum !== "undefined") {
      // Request account access if needed
      window.ethereum
        .request({
          method: "eth_requestAccounts",
          params: [],
        })
        .then((res) => console.log("request accounts", res))
        .catch((e) => console.log("request accounts ERR", e));

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      setAccountAddress(accounts[0]);
      // Set Metamask status
      setMmStatus("Connected!");
      setIsConnected(true);
    } else {
      alert("Please install Metamask!");
    }
  }

  // Disconnect from Metamask
  async function DisconnectWallet() {
    // Disconnect Metamask
    await window.ethereum.on("disconnect", (error) => {
      if (error) {
        console.error(error);
      }
    });
    // Set Metamask status
    setMmStatus("Not connected!");
    setIsConnected(false);
  }

  // Auto change network if not on 5ire Testnet
  useEffect(() => {
    (async () => {
      // check that network is changed or not
      window.ethereum.on("chainChanged", function (chainId) {
        window.location.reload();
      });

      // Define networkid
      const networkId = await window.ethereum.request({
        method: "net_version",
      });
      if (networkId !== "997") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x3e5" }],
          });
          alert("Switched to 5ire Testnet");
          window.location.reload(false);
        } catch (error) {
          if (error.code === 4902) {
            // User rejected the network switch
            alert("User rejected network to switch or Network not added yet");
          } else {
            console.log("Error switching network:", error);
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.ethereum]);

  const addChain = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x3e5",
            chainName: "5ire Testnet",
            blockExplorerUrls: ["https://explorer.5ire.network/"],
            nativeCurrency: { symbol: "5IRE", decimals: 18 },
            rpcUrls: ["https://rpc-testnet.5ire.network/"],
          },
        ],
      });
      window.alert("5ire Testnet added");
      window.location.reload();
    } catch (error) {
      console.log("Error adding 5ire Testnet:", error);
    }
  };

  // Read message from smart contract
  async function receive() {
    // Display message
    var displayMessage = await contracts.methods.read().call();
    setDisplayMessage(displayMessage);
  }

  // Write message to smart contract
  async function send() {
    // Get input value of message
    var getMessage = document.getElementById("message").value;
    setLoading(true);
    // Send message to smart contract
    await contracts.methods
      .write(getMessage)
      .send({ from: accountAddress })
      .on("transactionHash", function (hash) {
        setTxnHash(hash);
      });
    setLoading(false);
  }

  return (
    <div className="App">
      {/* Metamask status */}
      <div className="text-center">
        <h1>
          {getNetwork !== 0x3e5
            ? "Please make sure you're on the 5ire testnet network"
            : mmStatus}
        </h1>
      </div>
      <hr />
      <h1 className="text-center text-4xl font-bold mt-8">
          5ireact Dapp Starter
      </h1>

      <center>
        {isConnected && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md mt-8 mb-6"
            onClick={DisconnectWallet}
          >
            Log out
          </button>
        )}
        {!isConnected && (
          <>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md mt-8 mb-6"
              onClick={ConnectWallet}
            >
              Connect Wallet
            </button>
          </>
        )}
      </center>
      {/* Display address */}
      <center>
        {isConnected && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mt-4">
              Connected Address: {accountAddress}
            </h1>

            {/* Display Balance */}
            <h1 className="text-2xl font-bold mt-4">Balance: {balance} 5IRE</h1>
          </div>
        )}
      </center>
    </div>
  );
}

export default App;
