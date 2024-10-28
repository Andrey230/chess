import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Root from "./pages/Root";
import Login from "./pages/Login";
import Home from './pages/Home';
import './index.css'
import App from './App.tsx'
import {
    createBrowserRouter,
    RouterProvider,
    Navigate
} from "react-router-dom"
import Signup from "./pages/Signup";
import AddRepository from "./pages/AddRepository";
import Repository from "./pages/Repository";


const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <Home />,
                //loader: homeLoader,
            },
            {
                path: "/login",
                element: <Login />,
                //loader: homeLoader,
            },
            {
                path: "/sign-up",
                element: <Signup />,
                //loader: homeLoader,
            },
            {
                path: "/add-repository",
                element: <AddRepository />,
                //loader: homeLoader,
            },
            {
                path: "/repository/:repository_id",
                element: <Repository />,
            },
        ],
    },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>,
)
