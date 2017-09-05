# Before first start:
```console
sudo npm install -g ethereumjs-testrpc
sudo npm install -g truffle
```

Install the [MetaMask](https://metamask.io/) plugin in your Chrome or Firefox browser and setup an account.
You will get 12 words to restore your account. Store them safely and use them to restore the account on any browser!

# Start local ethereum test network (in a separate terminal window)
```console
testrpc -m "<your 12 words from metamask>"
```
By passing the -m parameter, the session of your testrpc network matches your metamask account!

# Install dependencies and migrate to the testrpc network:
```console
npm install
truffle migrate
```

# Start backend
```console
npm run start
```

Now get to the [frontend](../frontend) and run it.
