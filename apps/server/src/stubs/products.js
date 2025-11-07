const sampleProducts = [
  { id: 'unc0001-01', name: 'Maple Table', price: 25000 },
  { id: 'unc0002-01', name: 'Oak Chair', price: 12000 },
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const productsHandler = async (c, req, res) => {

  const delay = Math.round(10000 * Math.random())

  console.log(`\x1b[32m%s\x1b[0m`, `Simulating network delay: ${delay} ms`);

  await sleep(delay)

  return res.status(200).json({
    status: 'success',
    created: Date.now(),
    data: sampleProducts,
  })
}