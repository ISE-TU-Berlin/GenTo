'use strict';

import { Server } from "./server/server";
import { Config } from "./config";

let server = Server.bootstrap(Config.port);