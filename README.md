Welcome to mongo-datatable-provider
===================

This is a small library to fetch data from db using datatable request with manageable search, sort and pagination facility


----------

## STEPS TO USE
 - Check mongodb is installed and running
 - Suppose we have `customer` collection and we need to fetch `record_id` and `customer_name`
 - Below is the sample request

```
{
  "dataTable": {
    "draw": 1,
    "columns": [
      {
        "data": "record_id",
        "name": "Record ID",
        "searchable": true,
        "orderable": true
      },
      {
        "data": "customer_name",
        "name": "Customer Name",
        "searchable": true,
        "orderable": true
      }
    ],
    "order": [
      {
        "column": 0,
        "dir": "asc"
      }
    ],
    "start": 0,
    "length": 10,
    "search": {
      "value": "",
      "regex": false
    }
  }
}
```

It will sent the json data in following format based on the backend logic
```
{
  "draw": 1,
  "recordsTotal": 2,
  "recordsFiltered": 2,
  "data": [
    {
      "record_id": "5a5c4da84fd5e2ffaf339a01",
      "customer_name": "Smith Jow"
    },
    {
      "record_id": "5a6594ccd20984dc1347ad98",
      "customer_name": "Jane Jow"
    }
  ]
}
```



