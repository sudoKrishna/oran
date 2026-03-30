import {cookies} from "next/headers";
import { verifyToken } from "./jwt";

export  default async function GetUserFromRequest() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if(!token) return null;

    try {
        return verifyToken(token);
    } catch {
        return null ;
    }
}