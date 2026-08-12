import { useState, useEffect } from 'react';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO date string YYYY-MM-DD
  memo: string;
  timestamp: number;
}

const STORAGE_KEY = 'simplanner_account_book_data';

export function useAccountStore() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse account book data", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const clearData = () => {
    setTransactions([]);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `account_book_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            // Very basic validation
            const isValid = parsed.every(t => t.id && t.type && typeof t.amount === 'number');
            if (isValid) {
              setTransactions(parsed);
              resolve(true);
              return;
            }
          }
          resolve(false);
        } catch (err) {
          console.error("Import failed", err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  };

  const exportCSV = async () => {
    const headers = ['id', 'type', 'amount', 'category', 'date', 'memo', 'timestamp'];
    const rows = transactions.map(t => [
      t.id,
      t.type,
      t.amount.toString(),
      t.category,
      t.date,
      `"${(t.memo || '').replace(/"/g, '""')}"`,
      t.timestamp.toString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const fileName = `account_book_backup_${new Date().toISOString().split('T')[0]}.csv`;
    const file = new File(['\uFEFF' + csvContent], fileName, { type: "text/csv" });

    if (navigator.share) {
      try {
        // Some older implementations don't have canShare, so we just try to share
        await navigator.share({
          files: [file],
          title: '가계부 내역 백업',
          text: '가계부 엑셀 백업 데이터입니다.'
        });
        return; // Successfully shared
      } catch (err: any) {
        console.error("Share failed", err);
        // If the user cancelled the share dialogue, don't force a download
        if (err.name === 'AbortError') {
          return;
        }
        // If sharing files is not supported (e.g. some browsers), it will throw an error, 
        // in which case we continue to the fallback download below.
      }
    }

    // Fallback download
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importCSV = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Simple CSV parsing (does not handle newlines in memo properly, but sufficient for simple apps)
          const lines = content.split('\n').filter(line => line.trim() !== '');
          if (lines.length < 2) {
            resolve(false);
            return;
          }
          
          const headers = lines[0].split(',');
          
          const parsedTransactions: Transaction[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            // Regex to handle quoted CSV fields
            const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
            const row: string[] = [];
            let match;
            while ((match = regex.exec(lines[i])) !== null) {
              row.push(match[1].replace(/(^"|"$)/g, '').replace(/""/g, '"'));
            }
            // Basic fallback if regex split fails or length mismatch
            const values = row.length > 0 ? row : lines[i].split(',').map(v => v.trim());
            
            if (values.length >= 7) {
              parsedTransactions.push({
                id: values[0],
                type: values[1] as TransactionType,
                amount: Number(values[2]),
                category: values[3],
                date: values[4],
                memo: values[5],
                timestamp: Number(values[6])
              });
            }
          }

          const isValid = parsedTransactions.every(t => t.id && t.type && !isNaN(t.amount));
          if (isValid) {
            setTransactions(parsedTransactions);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          console.error("CSV Import failed", err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  };

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    clearData,
    exportData,
    importData,
    exportCSV,
    importCSV,
  };
}
