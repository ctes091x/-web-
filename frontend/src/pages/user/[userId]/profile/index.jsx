import { useParams } from 'react-router-dom'; export default function UserProfilePage() { const { userId } = useParams(); return <div className='p-4'><h1>ユーザープロフィール (ID: {userId})</h1></div>; }
