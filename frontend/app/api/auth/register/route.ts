import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function POST(req : Request) {
    const body = await req.json();

    const hashed  = await hashPassword(body.password)

    const user = await prisma.user.create({
        data : {
            email : body.email,
            password : hashed,
        },
    });

    return Response.json(user);
}
