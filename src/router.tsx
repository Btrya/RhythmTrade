import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Week from './pages/Week';
import PlanNew from './pages/PlanNew';
import PlanDetail from './pages/PlanDetail';
import AuthCallback from './pages/AuthCallback';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/week/:weekId',
    element: <Week />,
  },
  {
    path: '/plan/new',
    element: <PlanNew />,
  },
  {
    path: '/plan/:planId',
    element: <PlanDetail />,
  },
]);
