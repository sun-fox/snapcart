# Snapcart is basically, a Point Of Sale(POS) Application,
But it can be used for used for various other purposes.<br />

This is Snapcart API, that handles all the connections to the database.<br />
(*)The best feature of this API is that it can alter any table, under any database with just excepting the primary keys from the backend, i.e. Snapcart API is Agnostic of "App_database_name","tableName","columnName" and "unique_id".


<pre>
RESTful Routing:

A)     Functioning of the Route                                          Request Type                    URL

1.To receive all the data in any desired table                           GET Request         https://domain_name/App_database_name/tableName

2.To specific data from table for a particular ID                        GET Request         https://domain_name/App_database_name/tableName/columnname/id

3.To post data and append it to the database                             POST Request        https://domain_name/App_database_name/tableName/columnname/new

4.To edit data on the database for a particular ID                       PUT Request         https://domain_name/App_database_name/tableName/columnname/id/new

5.To remove data of a particular ID, from the database                   DELETE Request      https://domain_name/App_database_name/tableName/columnname/id/new

6.To upload any bulk ".csv" file into any table on database              POST Request        https://domain_name/App_database_name/import/tablename

7.To export database as ".csv" extension file in downloads               POST Request        https://domain_name/App_database_name/export/tablename

8.To register users on the Web_App i.e., SignUp Routes                   POST Request        https://domain_name/App_database_name/register

9.To login users on the Web App i.e., SignIn Routes                      POST Request        https://domain_name/App_database_name/login

So, These 9 routes can handle any operation from or on the database, and yes these operations are agnostic of "App_database_name","tableName","columnName" and "unique_id".

This is not an open source API, and it's © copyright are reserved solely with the creator.  
</pre>
