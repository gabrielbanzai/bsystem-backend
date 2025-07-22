class DatabaseService {


  async generateCreateTableSQL(tableName, columns) {
    const columnsSQL = columns.map(column => {
      const { name, type, constraints } = column;
      return `${name} ${type} ${constraints || ''}`;
    }).join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsSQL});`;
    return sql;
  }


}
export default DatabaseService
