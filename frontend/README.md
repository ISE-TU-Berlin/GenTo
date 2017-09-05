# Frontend

Since we deploy contracts using [MetaMask](https://metamask.io/), the frontend needs to run on a webserver, not only as a file in the browser.

The simplest way to run the frontend on a webserver, is installing the `http-server` npm module globally once:

```console
sudo npm install -g http-server
```

Now run the http server using `http-server .` .
The site should be available at http://localhost:8080/ now.
