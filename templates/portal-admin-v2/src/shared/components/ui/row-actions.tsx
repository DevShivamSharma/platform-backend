import React from "react"
import { Button } from "./button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "./dropdown-menu"

interface RowActionsProps<T> {
    row: T
    onEdit?: (row: T) => void
    onDelete?: (row: T) => void
    canEdit?: boolean
    canDelete?: boolean
    extraItems?: React.ReactNode
}

function RowActionsInner<T>({
    row,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
    extraItems,
}: RowActionsProps<T>) {
    const showEdit = !!canEdit && !!onEdit
    const showDelete = !!canDelete && !!onDelete

    if (!showEdit && !showDelete && !extraItems) return null
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {showEdit && (
                    <DropdownMenuItem onClick={() => onEdit(row)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                    </DropdownMenuItem>
                )}
                {extraItems}
                {showDelete && (
                    <>
                        {(showEdit || extraItems) && <DropdownMenuSeparator />}
                        <DropdownMenuItem destructive onClick={() => onDelete(row)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const RowActions = React.memo(RowActionsInner) as typeof RowActionsInner
