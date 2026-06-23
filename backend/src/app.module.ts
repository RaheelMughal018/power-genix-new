import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthsModule } from './auths/auths.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig, { DatabaseConfig } from './config/database.config';
import appConfig from './config/app.config';

import validationSchema from './config/env.validation';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from './auths/guards/access-token.guard';
import { AdminGuard } from './auths/guards/admin.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthenticationGuard } from './auths/guards/authentication.guard';
import { DataResponseInterceptor } from './common/interceptors/data-response.interceptor';
import { PaginationModule } from './common/pagination/pagination.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { CategoriesModule } from './categories/categories.module';
import { AccountsModule } from './accounts/accounts.module';
import { ItemsModule } from './items/items.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { RecipesModule } from './recipes/recipes.module';
import { ProductionModule } from './production/production.module';
import { PurchaseInvoicesModule } from './purchase-invoices/purchase-invoices.module';
import { SaleInvoicesModule } from './sale-invoices/sale-invoices.module';
import { SoldInvertersModule } from './sold-inverters/sold-inverters.module';
import { UnsoldInvertersModule } from './unsold-inverters/unsold-inverters.module';
import { RepairInvoicesModule } from './repair-invoices/repair-invoices.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SupplierPaymentsModule } from './supplier-payments/supplier-payments.module';
import { CustomerPaymentsModule } from './customer-payments/customer-payments.module';
import { StockAdjustmentsModule } from './stock-adjustments/stock-adjustments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AssetsModule } from './assets/assets.module';
import { PdfModule } from './common/pdf/pdf.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      validationSchema,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');
        if (!dbConfig) {
          throw new Error('Database config not found');
        }
        return {
          type: 'postgres',
          ...(dbConfig.url
            ? { url: dbConfig.url }
            : {
                host: dbConfig.host,
                port: dbConfig.port,
                username: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.name,
              }),
          synchronize: dbConfig.synchronize,
          autoLoadEntities: dbConfig.autoLoadEntities,
          ssl: dbConfig.url ? { rejectUnauthorized: false } : false,
          extra: {
            statement_timeout: 20000,
            query_timeout: 20000,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PaginationModule,
    UsersModule,
    AuthsModule,
    AdminModule,
    SettingsModule,
    CategoriesModule,
    AccountsModule,
    ItemsModule,
    SuppliersModule,
    CustomersModule,
    RecipesModule,
    ProductionModule,
    PurchaseInvoicesModule,
    SaleInvoicesModule,
    SoldInvertersModule,
    UnsoldInvertersModule,
    RepairInvoicesModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    SupplierPaymentsModule,
    CustomerPaymentsModule,
    StockAdjustmentsModule,
    DashboardModule,
    AssetsModule,
    PdfModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AccessTokenGuard,
    AdminGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor,
    },
  ],
})
export class AppModule {}
