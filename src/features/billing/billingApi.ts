import { baseApi } from "../api/baseApi";

export interface Invoice {
  id: string;
  invoiceNo: string;
  patientId: string;
  encounterId?: string;
  total: number;
  balanceDue: number;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  invoiceId: string;
  amount: number;
  method: string;
  paidAt: string;
}

export interface CreateInvoiceInput {
  patientId: string;
  currency?: string;
  items: Array<{
    serviceCode?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
  }>;
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<{ success: boolean; data: Invoice[] }, { status?: string }>({
      query: (params) => ({ url: "/billing/invoices", params }),
      providesTags: ["Invoice"],
    }),

    createInvoice: builder.mutation<{ success: boolean; data: Invoice }, CreateInvoiceInput>({
      query: (body) => ({ url: "/billing/invoices", method: "POST", body }),
      invalidatesTags: ["Invoice"],
    }),

    recordPayment: builder.mutation<
      { success: boolean; data: Payment },
      { invoiceId: string; amount: number; method: string }
    >({
      query: ({ invoiceId, ...body }) => ({
        url: `/billing/invoices/${invoiceId}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoice"],
    }),
  }),
});

export const { useGetInvoicesQuery, useCreateInvoiceMutation, useRecordPaymentMutation } = billingApi;
