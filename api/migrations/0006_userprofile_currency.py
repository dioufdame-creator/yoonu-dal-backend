from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_update_expense_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='currency',
            field=models.CharField(default='XOF', max_length=3),
        ),
    ]
