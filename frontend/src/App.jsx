import {

  Routes,
  Route

} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import AddDress from "./pages/AddDress";
import CustomerDashboard
from "./pages/CustomerDashboard";

import ProviderDashboard
from "./pages/ProviderDashboard";

import AdminDashboard
from "./pages/AdminDashboard";

import MainLayout from "./layouts/MainLayout";
import DressDetails from "./pages/DressDetails";
import Checkout from "./pages/Checkout";

import './App.css';

function App() {

  return (

    <MainLayout>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />
        <Route
          path="/add-dress"
          element={<AddDress />}
        />
        <Route
  path="/customer"
  element={<CustomerDashboard />}
/>

<Route
  path="/provider"
  element={<ProviderDashboard />}
/>

<Route
  path="/admin"
  element={<AdminDashboard />}
/>

        <Route
          path="/dress/:id"
          element={<DressDetails />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

      </Routes>

    </MainLayout>
  );
}

export default App;