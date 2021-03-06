var columnDefs = [
    // this row shows the row index, doesn't use any data from the row
    {headerName: "#", width: 50, cellRenderer: function(params) {
        return params.node.id + 1;
    } },
    {headerName: "Athlete", field: "athlete", width: 150},
    {headerName: "Age", field: "age", width: 90},
    {headerName: "Country", field: "country", width: 120},
    {headerName: "Year", field: "year", width: 90},
    {headerName: "Date", field: "date", width: 110},
    {headerName: "Sport", field: "sport", width: 110},
    {headerName: "Gold", field: "gold", width: 100},
    {headerName: "Silver", field: "silver", width: 100},
    {headerName: "Bronze", field: "bronze", width: 100},
    {headerName: "Total", field: "total", width: 100}
];

var gridOptions = {
    enableColResize: true,
    debug: true,
    columnDefs: columnDefs,
    rowModelType: 'viewport'
};

// client code (ie your code) will call this constructor, pass in whatever you need for the
// viewport to do it's job
function ViewportDatasource(mockServer) {
    this.mockServer = mockServer;
    this.connectionId = this.mockServer.connect(this.eventListener.bind(this));
}

// gets called by the grid, tells us what rows the grid is displaying, so time for
// us to tell the server to give us the rows for that displayed range
ViewportDatasource.prototype.setViewportRange = function(firstRow, lastRow) {
    this.mockServer.setViewportRange(this.connectionId, firstRow, lastRow);
};

// gets called by the grid, provides us with the callbacks we need
ViewportDatasource.prototype.init = function(params) {
    this.params = params;
};

// gets called by grid, when grid is destroyed or this datasource is swapped out for another one
ViewportDatasource.prototype.destroy = function() {
    this.mockServer.disconnect(this.connectionId);
};

// manages events back from the server
ViewportDatasource.prototype.eventListener = function(event) {
    switch (event.eventType) {
        case 'rowCountChanged': this.onRowCountChanged(event); break;
        case 'rowData': this.onRowData(event); break;
        case 'dataUpdated': this.onDataUpdated(event); break;
    }
};

// process rowData event
ViewportDatasource.prototype.onRowData = function(event) {
    var rowDataFromServer = event.rowDataMap;
    this.params.setRowData(rowDataFromServer);
};

// process dataUpdated event
ViewportDatasource.prototype.onDataUpdated = function(event) {
    var that = this;
    event.changes.forEach( function(change) {
        var rowNode = that.params.getRow(change.rowIndex);
        if (rowNode.data) {
            // rowNode.data[change.columnId] = change.newValue;
            // this is a trick, it gets the row to refresh
            rowNode.setDataValue(change.columnId, change.newValue);
        }
    });
};

// process rowCount event
ViewportDatasource.prototype.onRowCountChanged = function(event) {
    var rowCountFromServer = event.rowCount;
    // this will get the grid to make set the height of the row container, so we can scroll vertically properly
    this.params.setRowCount(rowCountFromServer);
};

function setRowData(rowData) {
    // set up a mock server - real code will not do this, it will contact your
    // real server to get what it needs
    var mockServer = new MockServer();
    mockServer.init(rowData);
    
    var viewportDatasource = new ViewportDatasource(mockServer);
    gridOptions.api.setViewportDatasource(viewportDatasource);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    // do http request to get our sample data - not using any framework to keep the example self contained.
    // you will probably use a framework like JQuery, Angular or something else to do your HTTP calls.
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', '../olympicWinners.json');
    httpRequest.send();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var httpResponse = JSON.parse(httpRequest.responseText);
            setRowData(httpResponse);
        }
    };
});
