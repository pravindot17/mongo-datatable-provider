/**
 * Created by Pravin Lolge on 09/04/2018.
 */
var lib_es = {
    getDataTableMongo: getDataTableMongo
};

/**
 * getDataTableMongo - This method is used to fetch the json data based on a datatable request
 *
 * @param  data {object} Request object
 * @param  callback {function} callback function
 * @return calls callback function
 * @author Pravin Lolage
 */
function getDataTableMongo(mongo_con, reqData, collection_name, callback) {
    if(reqData.dataTable) {
        var dataTableReq = (typeof reqData.dataTable === "object" ? reqData.dataTable : JSON.parse(reqData.dataTable));
        var responseData = {
            draw: dataTableReq.draw,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
        };

        runDataTableQueries(mongo_con, reqData, collection_name, responseData, function (err, rows) {
            if (err) {
                __logger.error(err);
                callback(err, null);
            } else {
                __logger.debug("rows", JSON.stringify(rows));
                callback(null, rows);
            }
        });
    } else {
        callback(new Error("Please provide proper datatable request"), null);
    }
}

function runDataTableQueries(mongo_con, reqData, collection_name, responseData, callback) {
    var dataTableReq = (typeof reqData.dataTable === "object" ? reqData.dataTable : JSON.parse(reqData.dataTable));
    async.auto({
        getTotalRecords: function(fcallback) {
            __logger.debug("List:: in getTotalRecords");
            var search = {};
            if(reqData.query.match) {
                search = JSON.parse(JSON.stringify(reqData.query.match));
            }

            if(dataTableReq.search.value) {
                search.$or = generateSearchQuery(dataTableReq, reqData);
            }

            __logger.debug("search criteria", JSON.stringify(search));
            mongo_con.conn.collection(collection_name).count(search, function (err, count) {
                if(err) {
                    __logger.debug("List:: error while getting total records", err.message);
                    fcallback(err, null);
                } else {
                    responseData.recordsTotal = count;
                    fcallback(null, null);
                }
            });
        },
        getFilteredRecords: function(fcallback) {
            __logger.debug("List:: in getFilteredRecords");
            var search_criteria = {};
            var sort_criteria = {};
            var limit = 10;
            var offset = 0;

            if(dataTableReq.length) {
                offset = dataTableReq.start;
                limit = dataTableReq.length;
            }

            if(dataTableReq.search.value) {
                reqData.query.match.$or = generateSearchQuery(dataTableReq, reqData);
            }

            if(dataTableReq.order.length) {
                var sortObj = generateOrderQuery(dataTableReq);
                if(sortObj.sort.length) {
                    sort_criteria[sortObj.sort[0]] = sortObj.order[0] == 'asc' ? 1 : -1;
                }
            }

            var localSearchAgg = [
                {
                    "$match": reqData.query.match
                },
                { $project : reqData.query.project },
                {
                    "$skip": offset
                },
                {
                    "$limit": limit
                },
                {
                    "$sort": sort_criteria
                }
            ];

            // __logger.debug("List:: search criteria", JSON.stringify(localSearchAgg));
            mongo_con.conn.collection(collection_name).aggregate(JSON.parse(JSON.stringify(localSearchAgg)), {}, function (err, resp) {
                if (err) {
                    __logger.error('List:: something went wrong while fetching filtered records', err.message);
                    fcallback(err, null);
                } else {
                    responseData.recordsFiltered = resp ? resp.length : 0;
                    responseData.data = resp;
                    fcallback(null, null);
                }
            });
        },
    }, function(err, results) {
        __logger.debug("Customer:: final callback reached");
        if(err) {
            callback(err, null);
        } else {
            callback(null, responseData);
        }
    });
}

function generateOrderQuery(requestQuery) {
    var sort = [];
    var order_ad = [];
    requestQuery = (typeof requestQuery === "object" ? requestQuery : JSON.parse(requestQuery));

    for (var fdx = 0; fdx < requestQuery.order.length; fdx++) {
        var order = requestQuery.order[fdx];
        var column = requestQuery.columns[order.column];

        if (column.orderable === true) {
            var columnName = column.data;
            sort.push(columnName);
            order_ad.push(order.dir);
        }
    }
    return {sort: sort, order: order_ad};
}

function generateSearchQuery(requestQuery, reqData) {
    var search_ad = [];
    requestQuery = (typeof requestQuery === "object" ? requestQuery : JSON.parse(requestQuery));

    for (var fdx = 0; fdx < requestQuery.columns.length; fdx++) {
        var column = requestQuery.columns[fdx];

        if (column.orderable === true && column.data) {

            var search = {};
            var col = column.data;
            if(reqData.query.columnsMap) {
                var newCol = (reqData.query.columnsMap[col]? reqData.query.columnsMap[col].name:null) || col;

                if(reqData.query.columnsMap[col] && reqData.query.columnsMap[col].type == 'number')
                search[newCol] = parseInt(requestQuery.search.value);
                else
                search[newCol] = {'$regex': requestQuery.search.value, '$options': 'i'};
            } else {
                search[col] = {'$regex': requestQuery.search.value, '$options': 'i'};
            }
            search_ad.push(search);
        }
    }
    return search_ad;
}

function getLimitedRecords(array, offset, limit) {
    return _.slice(array, offset, limit);
}

module.exports = lib_es;
