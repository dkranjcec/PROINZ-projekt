'use client'

import { useState, useEffect } from 'react'
import { addPriceListItem, deletePriceListItem, getPriceList } from './actions'

export default function PriceListSection({ userId }: { userId: string }) {
  const [priceList, setPriceList] = useState<Array<{ productid: number; productname: string; price: number }>>([])
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadPriceList()
  }, [])
  
  async function loadPriceList() {
    try {
      setIsLoading(true)
      const data = await getPriceList(userId)
      setPriceList(data.map(row => ({
        productid: row.productid as number,
        productname: row.productname as string,
        price: row.price as number
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price list')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price')
      setIsSubmitting(false)
      return
    }
    
    try {
      await addPriceListItem(userId, productName, priceNum)
      setProductName('')
      setPrice('')
      await loadPriceList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add price list item')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  async function handleDeleteItem(productId: number) {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await deletePriceListItem(userId, productId)
      await loadPriceList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* cursor composer 1 model was used */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Price List</h2>
        <p className="text-gray-600 mb-6">Manage your club's products and services pricing</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAddItem} className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                Product/Service Name *
              </label>
              <input
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Court Rental (1 hour)"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Item'}
          </button>
        </form>
        
        {isLoading ? (
          <p className="text-gray-500">Loading price list...</p>
        ) : priceList.length === 0 ? (
          <p className="text-gray-500">No items in price list yet.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product/Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {priceList.map((item) => (
                  <tr key={item.productid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteItem(item.productid)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

