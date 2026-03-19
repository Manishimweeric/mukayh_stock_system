import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import Login from './components/Autho/Login';
import Register from './components/Autho/Register';
import Dashboard from './components/Layout/MainLayout';
import AddUser from './components/Users/AddUser';
import UsersList from './components/Users/UsersList';
import AddCategory from './components/Category/AddCategory';
import CategoriesList from './components/Category/CategoriesList';
import AddMaterialForm from './components/Material/AddMaterial';
import AddSupplier from './components/Supplier/AddSupplier';
import SuppliersList from './components/Supplier/SuppliersList';
import MaterialsList from './components/Material/MaterialsList.jsx';
import EditMaterial from './components/Material/EditMaterial.jsx';
import LowStockMaterials from './components/Material/LowStockMaterials.jsx';
import StockMovement from './components/StockMovement/StockMovement.jsx';
import StockMovementsList from './components/StockMovement/StockMovementsList.jsx';
import DemandForecast from './components/DemandForecast/DemandForecast.jsx';

import AlertsList from './components/Alerts/AlertsList.jsx';
import DashboardAdmin from './components/Dashboard/dashboard.jsx';
import CustomersList from './components/Customers/CustomersList.jsx';
import AddCustomerForm from './components/Customers/AddCustomerForm.jsx';
import SalesList from './components/Sales/SalesList.jsx';
import AddSaleForm from './components/Sales/AddSaleForm.jsx';


function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inventory" element={<Dashboard />}>
            <Route path="users/add-new" element={<AddUser />} />
            <Route path="dashboard/admin" element={<DashboardAdmin />} />
            <Route path="users/list" element={<UsersList />} />
            <Route path="categories/add" element={<AddCategory />} />
            <Route path="categories/list" element={<CategoriesList />} />
            <Route path="item/add-new" element={<AddMaterialForm />} />
            <Route path="suppliers/add-new" element={<AddSupplier />} />
            <Route path="suppliers/list" element={<SuppliersList />} />
            <Route path="items/list" element={<MaterialsList />} />
            <Route path="items/edit/:id" element={<EditMaterial />} />
            <Route path="items/low-stock" element={<LowStockMaterials />} />
            <Route path="stock/movement" element={<StockMovement />} />
            <Route path="stock/movement/list" element={<StockMovementsList />} />
            <Route path="forecasting" element={<DemandForecast />} />
            <Route path="alerts" element={<AlertsList />} />
            <Route path="customers/list" element={<CustomersList />} />
            <Route path="customers/add-new" element={<AddCustomerForm />} />
            <Route path="sales/list" element={<SalesList />} />
            <Route path="sales/add-new" element={<AddSaleForm />} />

          </Route>
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
        toastStyle={{
          backgroundColor: '#ffffff',
          color: '#333333',
          borderRadius: '8px',
          border: '1px solid #ddd',
          padding: '10px',
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
          maxWidth: '500px',
          minWidth: '300px',
          fontSize: '14px',
          textAlign: 'center',
        }}

      />
    </>
  )
}

export default App
