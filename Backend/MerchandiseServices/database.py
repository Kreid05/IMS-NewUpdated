import aioodbc

# credentials
server = '127.0.0.1,1433'
database_name = 'bleuIMS'
driver = 'ODBC Driver 17 for SQL Server'

async def test_connection():
    dsn = f"DRIVER={driver};SERVER={server};DATABASE={database_name}; Trusted_Connection=yes;"
    try:
        print(f"Attempting connection to: {dsn}")
        conn = await aioodbc.connect(dsn=dsn, autocommit=True)
        print("Connection Successful!")
        await conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

# db connection
async def get_db_connection():
    dsn = f"DRIVER={driver};SERVER={server};DATABASE={database_name}; Trusted_Connection=yes;"
    try:
        conn = await aioodbc.connect(dsn=dsn, autocommit=True)
        return conn
    except Exception as e:
        print(f"Error establishing database connection: {e}")
        raise