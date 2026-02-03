import pg8000

try:
    conn = pg8000.Connection(
        user="kyzzen_admin",
        password="admin123",
        host="127.0.0.1",
        port="5433",
        database="kyzzen_db"
    )
    print("✅ CONEXÃO COM SUCESSO!")
    conn.close()
except Exception as e:
    print(f"❌ ERRO REAL: {e}")