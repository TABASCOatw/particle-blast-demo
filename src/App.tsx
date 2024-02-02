import React, { useState, useEffect } from 'react';
import { useEthereum, useConnect, useAuthCore } from '@particle-network/auth-core-modal';
import { BlastSepolia } from '@particle-network/chains';
import { AAWrapProvider, SendTransactionMode, SmartAccount } from '@particle-network/aa';
import { ethers } from 'ethers';
import { notification } from 'antd';

import './App.css';

const App = () => {
  const { provider } = useEthereum();
  const { connect, disconnect } = useConnect();
  const { userInfo } = useAuthCore();

  const [balance, setBalance] = useState(null);

  const smartAccount = new SmartAccount(provider, {
    projectId: process.env.REACT_APP_PROJECT_ID,
    clientKey: process.env.REACT_APP_CLIENT_KEY,
    appId: process.env.REACT_APP_APP_ID,
    aaOptions: {
      accountContracts: {
        BICONOMY: [{ chainIds: [BlastSepolia.id], version: '2.0.0' }]
      }
    }
  });

  const customProvider = new ethers.providers.Web3Provider(new AAWrapProvider(smartAccount, SendTransactionMode.Gasless), "any");

  useEffect(() => {
    if (userInfo) {
      fetchBalance();
    }
  }, [userInfo]);

  const fetchBalance = async () => {
    const address = await smartAccount.getAddress();
    const balanceResponse = await customProvider.getBalance(address);
    setBalance(ethers.utils.formatEther(balanceResponse));
  };

  const handleLogin = async (authType) => {
    if (!userInfo) {
      await connect({
        socialType: authType,
        chain: BlastSepolia
      });
    }
  };

  const executeUserOp = async () => {
    const signer = customProvider.getSigner();

    const tx = {
      to: "0x000000000000000000000000000000000000dEaD",
      value: ethers.utils.parseEther("0.001"),
    };

    const txResponse = await signer.sendTransaction(tx);
    const txReceipt = await txResponse.wait();

    notification.success({
      message: "Transaction Successful",
      description: (
        <div>
          Transaction Hash: <a href={`https://testnet.blastscan.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{txReceipt.transactionHash}</a>
        </div>
      )
    });
  };

  const executeUserOpUSDB = async () => {
    const signer = customProvider.getSigner();

    const tokenContract = new ethers.Contract('0x83d0f53a26eb04082b0e187Df0d1f8c5a963e0C6', ["function transfer(address to, uint256 amount)"], signer);

    const txResponse = await tokenContract.transfer('0x000000000000000000000000000000000000dEaD', ethers.utils.parseEther('1'));
    const txReceipt = await txResponse.wait();

    notification.success({
      message: "Transaction Successful",
      description: (
        <div>
          Transaction Hash: <a href={`https://testnet.blastscan.io/tx/${txReceipt.transactionHash}`} target="_blank" rel="noopener noreferrer">{txReceipt.transactionHash}</a>
        </div>
      )
    });
  };

  return (
    <div className="App">
      <div className="logo-section">
        <img src="https://i.imgur.com/EerK7MS.png" alt="Logo 1" className="logo logo-big" />
        <img src="https://i.imgur.com/rXjFPry.png" alt="Logo 2" className="logo logo-big" />
      </div>
      {!userInfo ? (
        <div className="login-section">
          <button className="sign-button google-button" onClick={() => handleLogin('google')}>
            <img src="https://i.imgur.com/nIN9P4A.png" alt="Google" className="icon"/>
            Sign in with Google
          </button>
          <button className="sign-button twitter-button" onClick={() => handleLogin('twitter')}>
            <img src="https://i.imgur.com/afIaQJC.png" alt="Twitter" className="icon"/>
            Sign in with X
          </button>
          <button className="sign-button other-button" onClick={() => handleLogin('')}>
            <img src="https://i.imgur.com/VRftF1b.png" alt="Twitter" className="icon"/>
          </button>
        </div>
      ) : (
        <div className="profile-card">
          <h2>{userInfo.name}</h2>
          <div className="balance-section">
            <small>{balance} ETH</small>
            <button className="sign-message-button" onClick={executeUserOp}>Execute User Operation</button>
            <button className="sign-message-button usdb" onClick={executeUserOpUSDB}>Execute Transaction ($USDB)</button>
            <button className="disconnect-button" onClick={disconnect}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;