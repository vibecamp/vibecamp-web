
import { Router } from "../deps/oak.ts";
import pages from "./pages.ts";

export const router = new Router()

// Every routes file in this directory should have its register function
// imported and then called here!
pages(router)