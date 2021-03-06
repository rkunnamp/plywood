module Plywood {
  export class LessThanOrEqualAction extends Action {
    static fromJS(parameters: ActionJS): LessThanOrEqualAction {
      return new LessThanOrEqualAction(Action.jsToValue(parameters));
    }

    constructor(parameters: ActionValue) {
      super(parameters, dummyObject);
      this._ensureAction("lessThanOrEqual");
      this._checkExpressionTypes('NUMBER', 'TIME');
    }

    public getOutputType(inputType: PlyType): PlyType {
      var expressionType = this.expression.type;
      if (expressionType) this._checkInputTypes(inputType, expressionType);
      return 'BOOLEAN';
    }

    public _fillRefSubstitutions(typeContext: DatasetFullType, inputType: FullType, indexer: Indexer, alterations: Alterations): FullType {
      this.expression._fillRefSubstitutions(typeContext, indexer, alterations);
      return {
        type: 'BOOLEAN'
      };
    }

    protected _getFnHelper(inputType: PlyType, inputFn: ComputeFn, expressionFn: ComputeFn): ComputeFn {
      return (d: Datum, c: Datum) => {
        return inputFn(d, c) <= expressionFn(d, c);
      }
    }

    protected _getJSHelper(inputType: PlyType, inputJS: string, expressionJS: string): string {
      return `(${inputJS}<=${expressionJS})`;
    }

    protected _getSQLHelper(inputType: PlyType, dialect: SQLDialect, inputSQL: string, expressionSQL: string): string {
      return `(${inputSQL}<=${expressionSQL})`;
    }

    protected _specialSimplify(simpleExpression: Expression): Action {
      if (simpleExpression instanceof LiteralExpression) { // x <= 5
        return new InAction({
          expression: new LiteralExpression({
            value: Range.fromJS({ start: null, end: simpleExpression.value, bounds: '(]' })
          })
        });
      }
      return null;
    }

    protected _performOnLiteral(literalExpression: LiteralExpression): Expression {
      // 5 <= x
      return (new InAction({
        expression: new LiteralExpression({
          value: Range.fromJS({ start: literalExpression.value, end: null, bounds: '[)' })
        })
      })).performOnSimple(this.expression);
    }
  }

  Action.register(LessThanOrEqualAction);

}
