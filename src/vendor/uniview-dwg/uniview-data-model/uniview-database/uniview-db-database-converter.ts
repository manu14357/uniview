import {
  UvCmPerformanceCollector,
  UvCmPerformanceEntry,
  UvCmTask,
  UvCmTaskError,
  UvCmTaskScheduler
} from '@uniview/common'

import { UvDbRenderingCache } from '../uniview-misc'
import { UvDbDatabase } from './uniview-db-database'

/**
 * Represents the different stages of DXF/DWG file conversion.
 *
 * These stages define the order and types of operations performed
 * during the conversion of a DXF or DWG file into an UvDbDatabase.
 */
export type UvDbConversionStage =
  /**
   * Start DXF/DWG file conversion
   */
  | 'START'
  /**
   * Parsing DXF/DWG file
   */
  | 'PARSE'
  /**
   * Downloading font files
   */
  | 'FONT'
  /**
   * Converting line types
   */
  | 'LTYPE'
  /**
   * Converting text styles
   */
  | 'STYLE'
  /**
   * Converting dimension styles
   */
  | 'DIMSTYLE'
  /**
   * Converting layers
   */
  | 'LAYER'
  /**
   * Converting viewports
   */
  | 'VPORT'
  /**
   * Converting block table record
   */
  | 'BLOCK_RECORD'
  /**
   * Converting file header
   */
  | 'HEADER'
  /**
   * Converting blocks
   */
  | 'BLOCK'
  /**
   * Converting entities in model space
   */
  | 'ENTITY'
  /**
   * Converting objects such as nod
   */
  | 'OBJECT'
  /**
   * Finish file conversion
   */
  | 'END'

/**
 * Represents the status of a stage.
 */
export type UvDbStageStatus = 'START' | 'END' | 'IN-PROGRESS' | 'ERROR'

/**
 * Callback function to update progress when parsing one file.
 *
 * This callback is called during the conversion process to provide
 * progress updates and stage information.
 *
 * @param percentage - Finish percentage (0-100)
 * @param stage - Name of the current stage
 * @param stageStatus - Status of the current stage
 * @param data - Store data associated with the current stage. Its meaning varies by stage:
 *   - 'FONT' stage: fonts needed by this drawing
 *
 * @example
 * ```typescript
 * const progressCallback: UvDbConversionProgressCallback = async (
 *   percentage,
 *   stage,
 *   stageStatus,
 *   data
 * ) => {
 *   console.log(`Progress: ${percentage}% - Stage: ${stage} - Status: ${stageStatus}`);
 *   if (stage === 'FONT' && data) {
 *     console.log('Fonts needed:', data);
 *   }
 * };
 * ```
 */
export type UvDbConversionProgressCallback = (
  /**
   * Finish percentage
   */
  percentage: number,
  /**
   * Name of the current stage.
   */
  stage: UvDbConversionStage,
  /**
   * Status of the current stage.
   */
  stageStatus: UvDbStageStatus,
  /**
   * Store data associated with the current stage. Its meaning of different stages are as follows.
   * - 'PARSE' stage: statistics of parsing task
   * - 'FONT' stage: fonts needed by this drawing
   *
   * Note: For now, 'PARSE' and 'FONT' stages use this field only.
   */
  data?: unknown,
  /**
   * Represents an error that occurred during task execution in the scheduler.
   */
  error?: UvCmTaskError
) => Promise<void>

/**
 * Interface defining the data for a conversion task.
 *
 * @template TIn - The input type for the task
 * @template TOut - The output type for the task
 */
interface UvDbConversionTaskData<TIn, TOut> {
  /**
   * The name of the task.
   */
  stage: UvDbConversionStage
  /**
   * The step of this task to add in the overall process.
   */
  step: number
  /**
   * The progress of the overall process.
   */
  progress: { value: number }
  /**
   * The function to notify progress.
   */
  task: (input: TIn) => Promise<TOut>
}

/**
 * Statistics of parsing task
 */
export interface UvDbParsingTaskStats {
  /**
   * The number of unknown types of entities (custom entities or entities not supported
   * by parser) in one drawing to parse
   */
  unknownEntityCount: number
}

/**
 * Interface defining type of return value of parsing task.
 */
export interface UvDbParsingTaskResult<TModel> {
  model: TModel | undefined
  data: UvDbParsingTaskStats
}

/**
 * Interface defining performance data for database conversion.
 */
export interface UvDbConvertDatabasePerformanceData {
  [key: string]: number
  total: number
}

const PERFORMANCE_ENTRY_NAME = 'Load Database'

/**
 * Task class for database conversion operations.
 *
 * This class extends UvCmTask to provide specialized functionality
 * for database conversion tasks, including progress tracking and
 * stage management.
 *
 * @template TIn - The input type for the task
 * @template TOut - The output type for the task
 */
class UvDbConversionTask<TIn, TOut> extends UvCmTask<TIn, TOut> {
  readonly data: UvDbConversionTaskData<TIn, TOut>
  readonly progress?: UvDbConversionProgressCallback

  constructor(
    data: UvDbConversionTaskData<TIn, TOut>,
    progress?: UvDbConversionProgressCallback
  ) {
    super(data.stage)
    this.data = data
    this.progress = progress
  }

  /**
   * Executes the task.
   */
  async run(input: TIn): Promise<TOut> {
    const entry = UvCmPerformanceCollector.getInstance().getEntry(
      PERFORMANCE_ENTRY_NAME
    )
    const t = Date.now()

    if (this.progress) {
      await this.progress(this.data.progress.value, this.data.stage, 'START')
    }
    const out = await this.data.task(input)
    if (this.progress) {
      await this.progress(
        this.data.progress.value,
        this.data.stage,
        'END',
        out ? (out as { data?: unknown }).data : null
      )
      this.data.progress.value += this.data.step
      if (this.data.progress.value > 100) {
        this.data.progress.value = 100
      }
    }
    if (entry) {
      ;(entry as UvCmPerformanceEntry<UvDbConvertDatabasePerformanceData>).data[
        this.name
      ] = Date.now() - t
    }

    return out
  }
}

/**
 * Configuration options for database converters.
 *
 * This interface defines the configuration parameters that can be passed
 * to database converters to customize their behavior during the conversion
 * process.
 */
export interface UvDbDatabaseConverterConfig {
  /**
   * Optional URL for web worker scripts used in the conversion process.
   *
   * When provided, this URL points to a web worker script that can be used
   * for offloading computationally intensive parsing tasks to a background
   * thread, improving performance and preventing UI blocking.
   *
   * @example
   * ```typescript
   * const config: UvDbDatabaseConverterConfig = {
   *   parserWorkerUrl: '/assets/dxf-parser-worker.js'
   * };
   * ```
   */
  parserWorkerUrl?: string | URL
  /**
   * Whether to use web workers for computationally intensive tasks.
   *
   * When set to `true`, the converter will attempt to use web workers
   * for computationally intensive tasks, which can improve performance
   * by offloading work to background threads and preventing UI blocking.
   *
   * When set to `false`, all computationally intensive operations will be
   * performed on the main thread.
   *
   * @default false
   *
   * @example
   * ```typescript
   * const config: UvDbDatabaseConverterConfig = {
   *   useWorker: true,
   *   parserWorkerUrl: '/assets/dxf-parser-worker.js'
   * };
   * ```
   */
  useWorker?: boolean
  /**
   * Whether to convert entities grouped by type.
   *
   * When set to `true`, the converter will process entities one type
   * at a time (e.g., all lines, then all circles, then all polylines),
   * which can help optimize rendering performance or simplify debugging by
   * handling each entity type in isolation.
   *
   * When set to `false`, entities are converted in the order they
   * appear in the source file.
   *
   * @default false
   *
   * @example
   * ```typescript
   * const config: UvDbDatabaseConverterConfig = {
   *   convertByEntityType: true
   * };
   * ```
   */
  convertByEntityType?: boolean
}

/**
 * Abstract base class for database converters.
 *
 * This class provides the foundation for converting various file formats
 * (such as DXF, DWG) into UvDbDatabase objects. It handles the conversion
 * process in stages and provides progress tracking capabilities.
 *
 * @template TModel - The type of the parsed model data
 *
 * @example
 * ```typescript
 * class MyConverter extends UvDbDatabaseConverter<MyModel> {
 *   protected parse(data: string | ArrayBuffer): MyModel {
 *     // Implementation for parsing data
 *   }
 *
 *   ......
 *
 *   protected processEntities(model: MyModel, db: UvDbDatabase) {
 *     // Implementation for processing entities
 *   }
 * }
 * ```
 */
export abstract class UvDbDatabaseConverter<TModel = unknown> {
  /** Optional progress callback for tracking conversion progress */
  progress?: UvDbConversionProgressCallback

  /** Configuration for the converter */
  readonly config: UvDbDatabaseConverterConfig

  /**
   * Creates a new instance of the database converter.
   *
   * @param config - Configuration options for the converter. This includes settings
   *                 such as worker URL for web workers used in the conversion process.
   *                 If not provided, an empty configuration object will be used.
   *
   * @example
   * ```typescript
   * // Create converter with default configuration
   * const converter = new UvDbDxfConverter();
   *
   * // Create converter with custom worker URL
   * const converter = new UvDbDxfConverter({
   *   parserWorkerUrl: '/assets/dxf-parser-worker.js'
   * });
   * ```
   */
  constructor(config: UvDbDatabaseConverterConfig = {}) {
    this.config = config
  }

  /**
   * Reads and converts data into an UvDbDatabase.
   *
   * This method orchestrates the entire conversion process, including
   * parsing, processing various components (fonts, linetypes, styles, etc.),
   * and building the final database.
   *
   * @param data - The input data to convert
   * @param db - The database to populate with converted data
   * @param minimumChunkSize - Minimum chunk size for batch processing
   * @param progress - Optional progress callback
   * @returns Promise that resolves when conversion is complete
   *
   */
  async read(
    data: ArrayBuffer,
    db: UvDbDatabase,
    minimumChunkSize: number,
    progress?: UvDbConversionProgressCallback
  ) {
    const loadDbTimeEntry: UvCmPerformanceEntry<UvDbConvertDatabasePerformanceData> =
      {
        name: PERFORMANCE_ENTRY_NAME,
        data: { total: 0 },
        format() {
          let result = ''
          Object.keys(this.data).forEach(key => {
            if (key !== 'total') {
              result += `- ${key}: ${this.data[key]} ms\n`
            }
          })
          result += `- total: ${this.data.total} ms`
          return result
        }
      }
    UvCmPerformanceCollector.getInstance().collect(loadDbTimeEntry)

    this.progress = progress

    const percentage = { value: 0 }
    const scheduler = new UvCmTaskScheduler<string | ArrayBuffer, void>()
    scheduler.setCompleteCallback(() => this.onFinished())
    scheduler.setErrorCallback((error: UvCmTaskError) => this.onError(error))
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'START',
          step: 1,
          progress: percentage,
          task: async (data: ArrayBuffer) => {
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'PARSE',
          step: 5,
          progress: percentage,
          task: async (data: ArrayBuffer) => {
            return await this.parse(data)
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'FONT',
          step: 5,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            const fonts = this.getFonts(data.model)
            return { model: data.model, data: fonts }
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'LTYPE',
          step: 1,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processLineTypes(data.model, db)
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'STYLE',
          step: 1,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processTextStyles(data.model, db)
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'DIMSTYLE',
          step: 1,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processDimStyles(data.model, db)
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'LAYER',
          step: 1,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processLayers(data.model, db)

            // Guarantee layer '0' is created at least
            if (db.tables.layerTable.numEntries === 0) {
              db.createDefaultData({ layer: true })
            }
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'VPORT',
          step: 1,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processViewports(data.model, db)
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'HEADER',
          step: 1,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processHeader(data.model, db)
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'BLOCK_RECORD',
          step: 5,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processBlockTables(data.model, db)
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'OBJECT',
          step: 5,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            this.processObjects(data.model, db)
            // Guarantee one layout is created for MODEL_SPACE at least
            if (db.objects.layout.numEntries === 0) {
              db.createDefaultData({ layout: true })
            }
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'BLOCK',
          step: 5,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            await this.processBlocks(data.model, db)
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'ENTITY',
          step: 100,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            await this.processEntities(
              data.model,
              db,
              minimumChunkSize,
              percentage,
              progress
            )
            return data
          }
        },
        progress
      )
    )
    scheduler.addTask(
      new UvDbConversionTask(
        {
          stage: 'END',
          step: 0,
          progress: percentage,
          task: async (data: { model: TModel }) => {
            return data
          }
        },
        progress
      )
    )

    const t = Date.now()
    await scheduler.run(data)
    loadDbTimeEntry.data.total = Date.now() - t
  }

  protected onError(error: UvCmTaskError) {
    if (this.progress) {
      const task = error.task as UvDbConversionTask<unknown, unknown>
      this.progress(
        task.data.progress.value,
        task.data.stage,
        'ERROR',
        undefined,
        error
      )
    }
    console.error(
      `Error occurred in conversion stage '${error.task.name}': `,
      error.error
    )

    // Tasks to convert entities are not critical to the conversion process
    // If failed to convert certain entities, we can still continue to convert
    // the rest of entities.
    if (error.task.name === 'ENTITY') {
      return false
    }
    this.onFinished()
    return true
  }

  protected onFinished() {
    if (this.progress) {
      this.progress(100, 'END', 'END')
      // Clear cache to reduce memory consumption
      UvDbRenderingCache.instance.clear()
    }
  }

  protected async parse(
    _data: ArrayBuffer,
    _workerUrl?: string
  ): Promise<UvDbParsingTaskResult<TModel>> {
    throw new Error('Not impelemented yet!')
  }

  protected getFonts(_model: TModel): string[] {
    throw new Error('Not impelemented yet!')
  }

  protected processLineTypes(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processTextStyles(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processDimStyles(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processLayers(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processViewports(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processHeader(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processBlockTables(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processObjects(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processBlocks(_model: TModel, _db: UvDbDatabase) {
    throw new Error('Not impelemented yet!')
  }

  protected processEntities(
    _model: TModel,
    _db: UvDbDatabase,
    _minimumChunkSize: number,
    _percentage: { value: number },
    _progress?: UvDbConversionProgressCallback
  ) {
    throw new Error('Not impelemented yet!')
  }
}
