import DashboardLayout from '../../components/DashboardLayout';

export default function TicketingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Ticketing Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage event tickets and bookings
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Tickets
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Create Ticket
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Ticket ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Event</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'TKT001', event: 'Diwali Puja', customer: 'John Doe', price: '₹500', status: 'Confirmed' },
                  { id: 'TKT002', event: 'Concert Night', customer: 'Jane Smith', price: '₹1000', status: 'Pending' },
                  { id: 'TKT003', event: 'Holi Festival', customer: 'Bob Johnson', price: '₹750', status: 'Confirmed' },
                ].map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-200 dark:border-slate-700">
                    <td className="py-3 px-4 text-gray-800 dark:text-white font-medium">{ticket.id}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ticket.event}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ticket.customer}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ticket.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        ticket.status === 'Confirmed' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-purple-600 dark:text-purple-400 hover:underline">View</button>
                        <button className="text-red-600 dark:text-red-400 hover:underline">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

