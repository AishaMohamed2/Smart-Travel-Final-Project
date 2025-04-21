import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('first_name', models.CharField(max_length=30)),
                ('last_name', models.CharField(max_length=30)),
                ('currency', models.CharField(default='GBP', max_length=3)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Trip',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('trip_name', models.CharField(max_length=255)),
                ('destination', models.CharField(max_length=255)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('total_budget', models.DecimalField(decimal_places=2, max_digits=10)),
                ('traveler_type', models.CharField(choices=[('luxury', 'Luxury'), ('medium', 'Medium'), ('budget', 'Budget')], default='medium', max_length=10)),
                ('savings', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('currency', models.CharField(default='GBP', max_length=3)),
                ('tripmate', models.ManyToManyField(blank=True, related_name='collaborated_trips', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trips', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('date', models.DateField()),
                ('category', models.CharField(choices=[('food', 'Food & Dining'), ('transport', 'Transport'), ('accommodation', 'Accommodation'), ('entertainment', 'Entertainment'), ('other', 'Other')], max_length=20)),
                ('description', models.TextField(blank=True, null=True)),
                ('original_currency', models.CharField(default='GBP', max_length=3)),
                ('trip', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to='api.trip')),
            ],
        ),
    ]
