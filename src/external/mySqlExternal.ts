module Plywood {
  interface SQLDescribeRow {
    Field: string;
    Type: string;
  }

  function postProcessIntrospect(columns: SQLDescribeRow[]): Attributes {
    return columns.map((column: SQLDescribeRow) => {
      var name = column.Field;
      var sqlType = column.Type.toLowerCase();
      if (sqlType === "datetime" || sqlType === "timestamp") {
        return new AttributeInfo({ name, type: 'TIME' });
      } else if (sqlType.indexOf("varchar(") === 0 || sqlType.indexOf("blob") === 0) {
        return new AttributeInfo({ name, type: 'STRING' });
      } else if (sqlType.indexOf("int(") === 0 || sqlType.indexOf("bigint(") === 0) {
        // ToDo: make something special for integers
        return new AttributeInfo({ name, type: 'NUMBER' });
      } else if (sqlType.indexOf("decimal(") === 0 || sqlType.indexOf("float") === 0 || sqlType.indexOf("double") === 0) {
        return new AttributeInfo({ name, type: 'NUMBER' });
      } else if (sqlType.indexOf("tinyint(1)") === 0) {
        return new AttributeInfo({ name, type: 'BOOLEAN' });
      }
      return null;
    }).filter(Boolean);
  }

  export class MySQLExternal extends SQLExternal {
    static type = 'DATASET';

    static fromJS(parameters: ExternalJS, requester: Requester.PlywoodRequester<any>): MySQLExternal {
      var value: ExternalValue = External.jsToValue(parameters, requester);
      return new MySQLExternal(value);
    }

    static getSourceList(requester: Requester.PlywoodRequester<any>): Q.Promise<string[]> {
      return requester({ query: "SHOW TABLES" })
        .then((sources) => {
          if (!Array.isArray(sources)) throw new Error('invalid sources response');
          if (!sources.length) return sources;
          var key = Object.keys(sources[0])[0];
          if (!key) throw new Error('invalid sources response (no key)');
          return sources.map((s: PseudoDatum) => s[key]).sort();
        });
    }

    static getVersion(requester: Requester.PlywoodRequester<any>): Q.Promise<string> {
      return requester({ query: 'SELECT @@version' })
        .then((res) => {
          if (!Array.isArray(res) || res.length !== 1) throw new Error('invalid version response');
          var key = Object.keys(res[0])[0];
          if (!key) throw new Error('invalid version response (no key)');
          return res[0][key];
        });
    }

    constructor(parameters: ExternalValue) {
      super(parameters, new MySQLDialect());
      this._ensureEngine("mysql");
    }

    protected getIntrospectAttributes(): Q.Promise<Attributes> {
      return this.requester({ query: `DESCRIBE ${this.dialect.escapeName(this.source as string)}`, }).then(postProcessIntrospect);
    }
  }

  External.register(MySQLExternal, 'mysql');
}
