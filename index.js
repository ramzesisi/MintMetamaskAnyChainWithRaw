const Web3 = require('web3');
const fs = require('fs');

async function sendTransaction(wallet, rawHex, web3, chainId) {
    const gasPricePromise = web3.eth.getGasPrice();
    const noncePromise = web3.eth.getTransactionCount(wallet.address, "pending");
    const [gasPrice_1, nonce] = await Promise.all([gasPricePromise, noncePromise]);
    const gasPrice = Math.ceil(gasPrice_1 * 1.05);
    const toaddress = "0x83b978cf73ee1d571b1a2550c5570861285af337";

    const tx = {
        from: wallet.address,
        to: toaddress,
        value: 0,
        chainId: chainId,
        data: rawHex,
        gasPrice: gasPrice,
        gas: 10000000,
        nonce: nonce
    };
    


    const signedTx = await web3.eth.accounts.signTransaction(tx, wallet.privateKey);

    web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        .once('transactionHash', hash => {
            console.log(`Transaction sent. Hash: ${hash}`);
        })
        .on('error', error => {
            console.error('Error sending transaction:', error);
        });
}

async function main() {
  
    const privateKeys = fs.readFileSync('privateKeys.txt', 'utf-8').split('\n');
    const rpcUrls = fs.readFileSync('rpcUrls.txt', 'utf-8').split('\n');

    const rawHex = "0x646174613a6170706c69636174696f6e2f6a736f6e2c7b2270223a226f70627263222c226f70223a226d696e74222c227469636b223a226f70626e227d";
    const numberOfTransactions = 1000;
    const transactionsPerKey = 10;

    const web3 = new Web3();

    for (let keyIndex = 0; keyIndex < privateKeys.length; keyIndex++) {
        const privateKey = privateKeys[keyIndex];

        for (let i = 0; i < transactionsPerKey; i++) {
            const rpcUrl = rpcUrls[Math.floor(Math.random() * rpcUrls.length)];

            web3.setProvider(new Web3.providers.HttpProvider(rpcUrl));
            const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
            const chainId = await web3.eth.getChainId();

        try {
            await sendTransaction(wallet, rawHex, web3, chainId);
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            if (error.message.includes("nonce too high")) {
                console.log("Nonce too high. Skipping this transaction.");
            } else if (error.message.includes("rate limit exceeded")) {
                console.log("Rate limit exceeded. Retrying after delay...");
                await new Promise(r => setTimeout(r, 5000));  // Adjust the delay as needed
                i--;  // Retry the same transaction
            } else {
                console.error("Error sending transaction:", error);
            }
        }
    }
    }
}

main();
