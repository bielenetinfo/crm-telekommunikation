import Backup from './pages/Backup';
import Branches from './pages/Branches';
import Calendar from './pages/Calendar';
import ContractDetail from './pages/ContractDetail';
import Contracts from './pages/Contracts';
import CustomerDetail from './pages/CustomerDetail';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import Reminders from './pages/Reminders';
import Tasks from './pages/Tasks';
import UserDetail from './pages/UserDetail';
import Users from './pages/Users';
import VVL from './pages/VVL';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Backup": Backup,
    "Branches": Branches,
    "Calendar": Calendar,
    "ContractDetail": ContractDetail,
    "Contracts": Contracts,
    "CustomerDetail": CustomerDetail,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "Providers": Providers,
    "Reminders": Reminders,
    "Tasks": Tasks,
    "UserDetail": UserDetail,
    "Users": Users,
    "VVL": VVL,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};