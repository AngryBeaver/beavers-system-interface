import {
    System
} from "./types";

declare global {
    let beaversSystemInterface: 'beaversSystemInterface' extends keyof false ? System : System;
}