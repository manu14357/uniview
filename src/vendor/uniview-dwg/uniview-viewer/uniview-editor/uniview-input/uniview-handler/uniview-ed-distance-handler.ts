import { UvEdNumericalHandler } from './uniview-ed-numerical-handler'

/**
 * Validates distance input.
 * Distances must be numeric and normally non-negative (AutoCAD behavior).
 */
export class UvEdDistanceHandler extends UvEdNumericalHandler {}
