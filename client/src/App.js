import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";
import ipfs from './ipfs';

import "./App.css";

class App extends Component {
  state = { 
    storageValue: null, 
    web3: null, 
    accounts: null, 
    contract: null,
    buffer: null,
    ipfsHash: null,
    account: null
  };

  componentWillMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;
    this.setState({account: accounts[0]});

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call({from: accounts[0]});

    // Update state with the result.
    this.setState({ ipfsHash: response });
  };

  captureFile = (event) => {
    console.log('capturefile..');
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({buffer: Buffer(reader.result)});
      console.log('buffer:', this.state.buffer);
    }
  };

  onSubmit = (event) => {
    event.preventDefault(); //now no refresh
    console.log('uploading...')
    ipfs.files.add(this.state.buffer, (err, result) => {
      if(err) {
        console.error(err);
        return;
      }
      
      this.state.contract.methods.set(result[0].hash).send({from: this.state.account})
      .then((r) => {
        this.setState({ ipfsHash: result[0].hash });
        console.log('ipfsHash:', this.state.ipfsHash);
      });

    });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <nav className="navbar" color="blue">
          <a href="#" className="puremenu">IPFS File Upload DApp</a>
        </nav>
        <br/>
        <h1>Your Image</h1>
        <p>This image is stored on IPFS & The Ethereum Blockchain!</p>
        <br/>
        <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt="" />      
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit}>
          <input type='file' onChange={this.captureFile} />
          <input type='submit' />
        </form>
      </div>
    );
  }
}

export default App;
