import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Testing() {
    const [members, setMembers] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        axios
            .get("http://localhost:8080/api/games/clash-royale/group/members", {
                params: { groupId: "R2L0YPGL" }
            })
            .then((res) => {
                setMembers(res.data.items ?? []);
            })
            .catch((err) => {
                setError(err.message);
            });
    }, []);

    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Clash Royale Testing</h1>
            {members.length === 0 ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {members.map((m) => (
                        <li key={m.tag}>
                            <b>{m.name}</b> - {m.tag}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}