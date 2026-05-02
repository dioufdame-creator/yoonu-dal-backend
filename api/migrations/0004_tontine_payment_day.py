from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_tontine_payout_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='tontine',
            name='payment_day',
            field=models.IntegerField(
                default=5,
                help_text='Jour limite de paiement des contributions (1-28)'
            ),
        ),
    ]
