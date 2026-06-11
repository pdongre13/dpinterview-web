"use client"
// Referece:
// https://mui.com/x/react-data-grid/
import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';


export type MuiDataGridProps = {
    columns: GridColDef[];
    rows: any[];
    pageSizeOptions: number[];
    height?: number;
    selectable?: boolean;
};

MuiDataGrid.defaultProps = {
    height: 400,
    selectable: false,
};

export default function MuiDataGrid(props: MuiDataGridProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <Box sx={{ height: props.height, width: '100%' }}>
            <DataGrid
            rows={props.rows}
            columns={props.columns}
            initialState={{
                pagination: {
                paginationModel: {
                    pageSize: props.pageSizeOptions[0],
                },
                },
            }}
            pageSizeOptions={props.pageSizeOptions}
            checkboxSelection={props.selectable}
            slots={{ toolbar: GridToolbar }}
            />
        </Box>
    );
}
