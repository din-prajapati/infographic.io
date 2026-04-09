import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
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
    queryKey: [getApiUrl('/payments/history')],
  });

  const payments = limit ? data?.payments?.slice(0, limit) : data?.payments;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CAPTURED':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'REFUNDED':
        return <Receipt className="h-4 w-4 text-muted-foreground" />;
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
      <div className="glass overflow-hidden rounded-xl border border-border" data-testid="card-payment-history-loading">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Payment History</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your recent transactions</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass overflow-hidden rounded-xl border border-border" data-testid="card-payment-history-error">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Payment History</h2>
          <p className="mt-1 text-sm text-muted-foreground">Unable to load payment history</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            There was an error loading your payment history. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="glass overflow-hidden rounded-xl border border-border" data-testid="card-payment-history-empty">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Payment History</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your recent transactions</p>
        </div>
        <div className="p-6">
          <div className="py-8 text-center">
            <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No payments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your payment history will appear here after your first transaction.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-xl border border-border" data-testid="card-payment-history">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold text-foreground">Payment History</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your recent transactions</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Method</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">Transaction ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                <TableCell className="text-foreground">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <span className="text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground" data-testid={`text-payment-amount-${payment.id}`}>
                  {formatAmount(payment.amount, payment.currency)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="text-sm">
                    {formatPaymentMethod(payment.method)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(payment.status)} data-testid={`badge-payment-status-${payment.id}`}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-xs text-muted-foreground">
                    {payment.externalPaymentId?.slice(-12) || payment.id.slice(-8)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

