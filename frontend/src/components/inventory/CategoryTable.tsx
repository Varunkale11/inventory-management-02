import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const categorys = [
    {
        id: 1,
        name: 'Electronics'
    },
]
function CategoryTable() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="pl-6 p-6">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {categorys.map((c) => (
                    <TableRow key={c.id}>
                        <TableCell className="font-medium pl-6 p-6 text-[16px]">{c.id}</TableCell>
                        <TableCell>
                            <span className="border rounded-2xl text-black font-medium text-sm px-2 py-1">
                                {c.name}
                            </span>
                        </TableCell>
                        {/* <TableCell className="text-[16px] ">{product.quantity}</TableCell>
                      <TableCell className="text-start text-[16px]">₹{product.price}</TableCell>
                      <TableCell className="flex gap-2">
                          <button
                              onClick={() => onEdit(product)}
                              className="hover:rounded-md hover:bg-green-100 px-4 py-2"
                          >
                              <SquarePen width={16} />
                          </button>
                          <button
                              onClick={() => onDelete(product.name)}
                              className="hover:rounded-md hover:bg-red-100 px-4 py-2"
                          >
                              <Trash2 width={16} />
                          </button>
                      </TableCell> */}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default CategoryTable