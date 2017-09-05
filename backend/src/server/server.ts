'use strict';

import * as express from "express";
import * as bodyparser from "body-parser";
import * as path from "path";
import * as fs from "fs";
import { Config } from "../config";
const Web3 = require("web3");

export class Server {
    public app: express.Application;

    public static bootstrap(port: number): Server {
        return new Server(port);
    }

    constructor(port: number) {
        this.initServer(port);
    }

    private initServer(port: number) {
        this.app = express();
        this.app.use(bodyparser.json());
        this.app.use(bodyparser.urlencoded({extended: true}));
        this.app.use((req: any, res: any, next: any) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
        this.initRoutes();
        this.app.listen(port, () => {
            console.log("Server running on port " + port + ".");
        });   
    }

    private initRoutes(){
        let web3 = new Web3();
        this.app.get('/contracts/factory', (req, res) => {
            let filename = path.join(__dirname, "..", "..", "build", "contracts", "GenToFactory.json");
            fs.readFile(filename, (err: any, data: any) => {
                if(err){
                    res.status(500).send("Check if contract factory has been migrated.");
                } else {
                    let jsonData = JSON.parse(data);
                    res.status(200).send(jsonData);
                }
            })
        });
        this.app.get('/contracts/auction', (req, res) => {
            let filename = path.join(__dirname, "..", "..", "build", "contracts", "AuctionToken.json");
            fs.readFile(filename, (err: any, data: any) => {
                if(err){
                    res.status(500).send("Check if auction token contract has been migrated.");
                } else {
                    let jsonData = JSON.parse(data);
                    res.status(200).send(jsonData);
                }
            })
        });
    }
}