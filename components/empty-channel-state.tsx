import Link from 'next/link'

export function EmptyChannelState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-semibold mb-4">No YouTube Channel Connected</h2>
      <p className="text-gray-600 mb-6">
        Connect your YouTube channel to start viewing analytics and insights
      </p>
      <Link
        href="/connect-channel"
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        Connect Channel
      </Link>
    </div>
  )
}
