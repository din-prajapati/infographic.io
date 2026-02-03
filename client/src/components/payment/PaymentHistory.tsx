import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import type { Payment } from "@shared/schema";

interface PaymentHistoryProps {
  limit?: number;
}

export function PaymentHistory({ limit }: PaymentHistoryProps) {
  const { data, isLoading, error } = useQuery<{ payments: Payment[] }>({
    queryKey: ['/api/payments/history'],
  });

  const payments = limit ? data?.payments?.slice(0, limit) : data?.payments;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CAPTURED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'REFUNDED':
        return <Receipt className="h-4 w-4 text-blue-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CAPTURED':
        return 'default';
      case 'FAILED':
        return 'destructive';
      case 'PENDING':
        return 'outline';
      case 'REFUNDED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const amountInRupees = amount / 100;
    if (currency === 'INR') {
      return `₹${amountInRupees.toLocaleString('en-IN')}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amountInRupees);
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return 'N/A';
    return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
  };

  if (isLoading) {
    return (
      <Card data-testid="card-payment-history-loading">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="card-payment-history-error">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Unable to load payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            There was an error loading your payment history. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card data-testid="card-payment-history-empty">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No payments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your payment history will appear here after your first transaction.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-payment-history">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>Your recent transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Transaction ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span className="text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium" data-testid={`text-payment-amount-${payment.id}`}>
                  {formatAmount(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatPaymentMethod(payment.method)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(payment.status)} data-testid={`badge-payment-status-${payment.id}`}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-xs text-muted-foreground font-mono">
                    {payment.externalPaymentId?.slice(-12) || payment.id.slice(-8)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

