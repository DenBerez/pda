import { NextApiResponse } from "next"

import { NextApiRequest } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { name } = req.body
        return res.status(200).json({ message: `User ${name} created!` })
    }

    if (req.method === 'GET') {
        return res.status(200).json({ users: ['Alice', 'Bob'] })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
}