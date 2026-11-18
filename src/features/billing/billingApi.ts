import { baseApi } from "../api/baseApi";

export interface Invoice {
  id: string;
  invoiceNo: string;
  patientId: string;
  encounterId?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<{ success: boolean; data: Invoice[] }, { status?: string }>({
      query: (params) => ({ url: "/billing/invoices", params }),
      providesTags: ["Invoice"],
    }),

    createInvoice: builder.mutation<{ success: boolean; data: Invoice }, Partial<Invoice>>({
      query: (body) => ({ url: "/billing/invoices", method: "POST", body }),
      invalidatesTags: ["Invoice"],
    }),

    recordPayment: builder.mutation<
      { success: boolean; data: Payment },
      { invoiceId: string; amount: number; paymentMethod: string }
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
