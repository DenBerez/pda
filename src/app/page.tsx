import DashboardGrid from './components/DashboardGrid';
import { Box, Container, Typography } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <DashboardGrid />
    </Container>
  );
}
