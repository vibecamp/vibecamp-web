import Admin from "../components/admin/Admin";
import { NextPageWithLayout } from "./_app";
import { configure as configureMobx } from 'mobx'

configureMobx({
    enforceActions: 'never'
})


const AdminPage: NextPageWithLayout = () => {
    return (
        <Admin />
    )
}

export default AdminPage